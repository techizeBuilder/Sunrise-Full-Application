import { Item, Category, CustomerCategory } from '../models/Inventory.js';
import * as XLSX from 'xlsx';
import multer from 'multer';
import { USER_ROLES } from '../../shared/schema.js';
import notificationService from '../services/notificationService.js';

// Helper function to check inventory permissions
const checkInventoryPermission = (user, action) => {
  // Super User has all permissions
  if (user.role === 'Super User') {
    return true;
  }
  
  // Allow Sales users to view items for order creation
  if (user.role === 'Sales' && action === 'view') {
    return true;
  }
  
  return user.permissions?.Inventory?.[action] === true;
};

// Auto-generate item code
const generateItemCode = async (type) => {
  const prefix = type.substring(0, 3).toUpperCase();
  const lastItem = await Item.findOne({ 
    code: { $regex: `^${prefix}` } 
  }).sort({ code: -1 });
  
  let nextNumber = 1;
  if (lastItem) {
    const lastNumber = parseInt(lastItem.code.substring(3));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// ITEM CONTROLLERS
export const getItems = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      category, 
      subCategory, 
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Subcategory filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$qty', '$minStock'] };
    }

    // Sort options - always prioritize newest items first
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    // Add secondary sorting if specified
    if (sortBy && sortBy !== 'createdAt') {
      if (sortBy === 'name') {
        sortOptions.name = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'code') {
        sortOptions.code = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'category') {
        sortOptions.category = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'qty') {
        sortOptions.qty = sortOrder === 'desc' ? -1 : 1;
      }
    }

    const items = await Item.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    // Calculate inventory statistics
    const stats = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$qty', '$stdCost'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$qty', '$minStock'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const typeStats = await Item.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalValue: { $sum: { $multiply: ['$qty', '$stdCost'] } }
        }
      }
    ]);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 },
      typeStats
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getItemById = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    
    // Handle special routes like 'export'
    if (id === 'export') {
      return exportItemsToExcel(req, res);
    }
    
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createItem = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'add')) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    const itemData = req.body;
    console.log('Received item data:', itemData);

    // Enhanced validation
    const validation = validateItemData(itemData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Auto-generate code if not provided or if code already exists
    if (!itemData.code || itemData.code.trim() === '') {
      itemData.code = await generateItemCode(itemData.type);
    } else {
      // Check if code already exists
      const existingItem = await Item.findOne({ code: itemData.code.trim() });
      if (existingItem) {
        console.log('Code already exists, auto-generating new code...');
        itemData.code = await generateItemCode(itemData.type);
      }
    }

    // Sanitize and prepare data
    const sanitizedData = sanitizeItemData(itemData);
    console.log('Sanitized data:', sanitizedData);
    
    const item = await Item.create(sanitizedData);
    console.log('Item saved successfully:', item);

    // Trigger notification for new inventory item
    try {
      await notificationService.triggerInventoryNotification(item, 'created');
      
      // Check for low stock alert
      if (item.qty <= (item.minStock || 10)) {
        await notificationService.triggerLowStockNotification(item);
      }
    } catch (notificationError) {
      console.error('Failed to send inventory notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ 
        message: 'Validation failed',
        errors: { [field]: `${field} already exists` }
      });
    } else if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      res.status(400).json({ 
        message: 'Validation failed',
        errors 
      });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Enhanced validation helper function
const validateItemData = (data, isUpdate = false) => {
  const errors = {};
  
  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Item name must be at least 2 characters';
  }
  
  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.category = 'Category is required';
  }
  
  // Customer category is optional with default value
  if (data.customerCategory && typeof data.customerCategory !== 'string') {
    errors.customerCategory = 'Customer Category must be a valid string';
  }
  
  if (!data.unit || typeof data.unit !== 'string' || data.unit.trim().length === 0) {
    errors.unit = 'Unit is required';
  }
  
  if (!data.type || typeof data.type !== 'string' || data.type.trim().length === 0) {
    errors.type = 'Item type is required';
  }
  
  if (!data.importance || typeof data.importance !== 'string' || data.importance.trim().length === 0) {
    errors.importance = 'Importance level is required';
  }
  if (!data.unit) {
    errors.unit = 'Unit is required';
  }

  // Numeric validations
  if (data.qty !== undefined && (isNaN(data.qty) || data.qty < 0)) {
    errors.qty = 'Quantity must be a non-negative number';
  }
  if (data.stdCost !== undefined && (isNaN(data.stdCost) || data.stdCost < 0)) {
    errors.stdCost = 'Standard cost must be a non-negative number';
  }
  if (data.purchaseCost !== undefined && (isNaN(data.purchaseCost) || data.purchaseCost < 0)) {
    errors.purchaseCost = 'Purchase cost must be a non-negative number';
  }
  if (data.salePrice !== undefined && (isNaN(data.salePrice) || data.salePrice < 0)) {
    errors.salePrice = 'Sale price must be a non-negative number';
  }
  if (data.mrp !== undefined && (isNaN(data.mrp) || data.mrp < 0)) {
    errors.mrp = 'MRP must be a non-negative number';
  }
  if (data.gst !== undefined && (isNaN(data.gst) || data.gst < 0 || data.gst > 100)) {
    errors.gst = 'GST must be between 0 and 100';
  }
  if (data.minStock !== undefined && (isNaN(data.minStock) || data.minStock < 0)) {
    errors.minStock = 'Minimum stock must be a non-negative number';
  }
  if (data.leadTime !== undefined && (isNaN(data.leadTime) || data.leadTime < 0)) {
    errors.leadTime = 'Lead time must be a non-negative number';
  }

  // Enum validations
  const validTypes = ['Product', 'Material', 'Spares', 'Assemblies'];
  if (data.type && !validTypes.includes(data.type)) {
    errors.type = 'Invalid item type';
  }

  const validImportance = ['Low', 'Normal', 'High', 'Critical'];
  if (data.importance && !validImportance.includes(data.importance)) {
    errors.importance = 'Invalid importance level';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Enhanced data sanitization helper
const sanitizeItemData = (data) => {
  const sanitized = { ...data };
  
  // Trim string fields and ensure they exist
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.code) sanitized.code = sanitized.code.trim();
  if (sanitized.category) sanitized.category = sanitized.category.trim();
  if (sanitized.subCategory) sanitized.subCategory = sanitized.subCategory.trim();
  if (sanitized.customerCategory) sanitized.customerCategory = sanitized.customerCategory.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim();
  if (sanitized.importance) sanitized.importance = sanitized.importance.trim();
  if (sanitized.batch) sanitized.batch = sanitized.batch.trim();
  if (sanitized.unit) sanitized.unit = sanitized.unit.trim();
  if (sanitized.store) sanitized.store = sanitized.store.trim();
  if (sanitized.hsn) sanitized.hsn = sanitized.hsn.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.internalNotes) sanitized.internalNotes = sanitized.internalNotes.trim();

  // Convert numeric fields
  if (sanitized.qty !== undefined) sanitized.qty = Number(sanitized.qty);
  if (sanitized.stdCost !== undefined) sanitized.stdCost = Number(sanitized.stdCost);
  if (sanitized.purchaseCost !== undefined) sanitized.purchaseCost = Number(sanitized.purchaseCost);
  if (sanitized.salePrice !== undefined) sanitized.salePrice = Number(sanitized.salePrice);
  if (sanitized.mrp !== undefined) sanitized.mrp = Number(sanitized.mrp);
  if (sanitized.gst !== undefined) sanitized.gst = Number(sanitized.gst);
  if (sanitized.minStock !== undefined) sanitized.minStock = Number(sanitized.minStock);
  if (sanitized.leadTime !== undefined) sanitized.leadTime = Number(sanitized.leadTime);

  // Convert boolean fields
  if (sanitized.internalManufacturing !== undefined) {
    sanitized.internalManufacturing = Boolean(sanitized.internalManufacturing);
  }
  if (sanitized.purchase !== undefined) {
    sanitized.purchase = Boolean(sanitized.purchase);
  }

  // Handle arrays
  if (sanitized.tags && Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags.filter(tag => tag && tag.trim()).map(tag => tag.trim());
  }
  if (sanitized.customerPrices && Array.isArray(sanitized.customerPrices)) {
    sanitized.customerPrices = sanitized.customerPrices.map(cp => ({
      category: cp.category ? cp.category.trim() : '',
      price: Number(cp.price) || 0
    }));
  }

  return sanitized;
};

export const updateItem = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'edit')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const itemData = req.body;

    // Enhanced validation
    const validation = validateItemData(itemData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Check if code is being changed and if it already exists
    if (itemData.code && itemData.code.trim() !== '') {
      const existingItem = await Item.findOne({ 
        code: itemData.code.trim(), 
        _id: { $ne: id } 
      });
      if (existingItem) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: { code: 'Item code already exists' }
        });
      }
    }

    // Sanitize and prepare data
    const sanitizedData = sanitizeItemData(itemData);
    
    const item = await Item.findByIdAndUpdate(
      id,
      sanitizedData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ 
        message: 'Validation failed',
        errors: { [field]: `${field} already exists` }
      });
    } else if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      res.status(400).json({ 
        message: 'Validation failed',
        errors 
      });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};



export const deleteItem = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'delete')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await Item.findByIdAndDelete(id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adjustStock = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'edit')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (typeof adjustment !== 'number') {
      return res.status(400).json({ message: 'Adjustment must be a number' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const newQty = item.qty + adjustment;
    if (newQty < 0) {
      return res.status(400).json({ message: 'Insufficient stock for this adjustment' });
    }

    item.qty = newQty;
    await item.save();

    res.json({
      message: 'Stock adjusted successfully',
      item,
      adjustment,
      reason
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// CATEGORY CONTROLLERS
export const getCategories = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const categories = await Category.find().sort({ createdAt: -1, name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'add')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { name, description, subcategories = [] } = req.body;
    console.log('Creating category with data:', { name, description, subcategories });

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Category name is required' 
      });
    }

    // Filter out empty subcategories
    const validSubcategories = subcategories.filter(sub => sub && sub.trim() !== '');

    const categoryData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      subcategories: validSubcategories
    };

    const category = await Category.create(categoryData);
    console.log('Category created successfully:', category);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: 'Category name already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  }
};

export const updateCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'edit')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const { name, description, subcategories = [] } = req.body;
    console.log('Updating category with data:', { id, name, description, subcategories });

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Category name is required' 
      });
    }

    // Filter out empty subcategories
    const validSubcategories = subcategories.filter(sub => sub && sub.trim() !== '');

    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      subcategories: validSubcategories
    };

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    console.log('Category updated successfully:', category);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: 'Category name already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'delete')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    // Check if category is being used by any items
    const itemsUsingCategory = await Item.countDocuments({ 
      $or: [
        { category: id },
        { category: (await Category.findById(id))?.name }
      ]
    });

    if (itemsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${itemsUsingCategory} items are using this category.` 
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// CUSTOMER CATEGORY CONTROLLERS
export const getCustomerCategories = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const customerCategories = await CustomerCategory.find().sort({ createdAt: -1, name: 1 });
    res.json({ customerCategories });
  } catch (error) {
    console.error('Get customer categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCustomerCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'add')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer category name is required' });
    }

    const customerCategory = await CustomerCategory.create({ name, description });

    res.status(201).json({
      message: 'Customer category created successfully',
      customerCategory
    });
  } catch (error) {
    console.error('Create customer category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Customer category name already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateCustomerCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'edit')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const customerCategory = await CustomerCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customerCategory) {
      return res.status(404).json({ message: 'Customer category not found' });
    }

    res.json({
      message: 'Customer category updated successfully',
      customerCategory
    });
  } catch (error) {
    console.error('Update customer category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCustomerCategory = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'delete')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    const customerCategory = await CustomerCategory.findByIdAndDelete(id);

    if (!customerCategory) {
      return res.status(404).json({ message: 'Customer category not found' });
    }

    res.json({ message: 'Customer category deleted successfully' });
  } catch (error) {
    console.error('Delete customer category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Configure multer for file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

// Export items to Excel - Simplified implementation
export const exportItemsToExcel = async (req, res) => {
  try {
    console.log('Starting Excel export for inventory items');
    const items = await Item.find({}).sort({ createdAt: -1 });
    console.log(`Found ${items.length} items to export`);
    
    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found to export', success: false });
    }

    // Create simple data structure for Excel
    const excelData = items.map((item, index) => ({
      'Serial No': index + 1,
      'Item Code': item.code || '',
      'Item Name': item.name || '',
      'Description': item.description || '',
      'Category': item.category || '',
      'Sub Category': item.subCategory || '',
      'Customer Category': item.customerCategory || '',
      'Unit': item.unit || 'pieces',
      'Purchase Price': item.purchasePrice || 0,
      'Sale Price': item.salePrice || 0,
      'Current Stock': item.qty || 0,
      'Min Stock': item.minStock || 0,
      'Max Stock': item.maxStock || 0,
      'Location': item.location || '',
      'Supplier': item.supplier || '',
      'Created Date': item.createdAt ? item.createdAt.toISOString().split('T')[0] : ''
    }));

    console.log(`Prepared ${excelData.length} items for Excel export`);
    
    // Generate Excel file
    const excelBuffer = createSimpleExcel(excelData, 'Inventory Items');
    
    const filename = `inventory_items_${Date.now()}.xlsx`;
    
    console.log(`Generated Excel file: ${filename}, Size: ${excelBuffer.length} bytes`);

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

    console.log(`Excel file sent successfully: ${filename}`);

  } catch (error) {
    console.error('Excel export error:', error);
    return res.status(500).json({ 
      message: 'Failed to export items to Excel', 
      error: error.message,
      success: false 
    });
  }
};

// Import items from Excel
export const importItemsFromExcel = [upload.single('file'), async (req, res) => {
  try {
    console.log('Import request received:', req.file ? 'File present' : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        results: null
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Parsed ${jsonData.length} rows from Excel`);

    if (jsonData.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Excel file is empty or has no valid data',
        results: null
      });
    }

    const results = {
      total: jsonData.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Enhanced field mapping with null/undefined safety
        const safeString = (value) => value ? String(value).trim() : '';
        const safeNumber = (value) => {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        };

        const itemData = {
          name: safeString(row['Item Name'] || row['Name'] || row['ItemName']),
          code: safeString(row['Item Code'] || row['Code'] || row['ItemCode']),
          description: safeString(row['Description'] || row['Desc']),
          category: safeString(row['Category'] || row['Cat']),
          subCategory: safeString(row['Sub Category'] || row['SubCategory'] || row['Subcategory']),
          customerCategory: safeString(row['Customer Category'] || row['CustomerCategory'] || row['CustCategory']),
          type: safeString(row['Type'] || row['ItemType'] || row['Product Type']) || 'Product',
          importance: safeString(row['Importance'] || row['Priority']) || 'Normal',
          unit: safeString(row['Unit'] || row['UOM']) || 'pieces',
          qty: safeNumber(row['Current Stock'] || row['Qty'] || row['Quantity'] || row['Stock']),
          minStock: safeNumber(row['Min Stock'] || row['MinStock'] || row['Minimum Stock']),
          maxStock: safeNumber(row['Max Stock'] || row['MaxStock'] || row['Maximum Stock']),
          stdCost: safeNumber(row['Standard Cost'] || row['StdCost'] || row['Std Cost']),
          purchaseCost: safeNumber(row['Purchase Price'] || row['Purchase Cost'] || row['PurchaseCost']),
          salePrice: safeNumber(row['Sale Price'] || row['SalePrice'] || row['Selling Price']),
          mrp: safeNumber(row['MRP'] || row['Mrp'] || row['Maximum Retail Price']),
          gst: safeNumber(row['GST'] || row['Gst'] || row['Tax'] || row['GST %']),
          hsn: safeString(row['HSN'] || row['Hsn'] || row['HSN Code']),
          batch: safeString(row['Batch'] || row['Batch No']),
          store: safeString(row['Store'] || row['Location'] || row['Warehouse'] || row['Store Location']),
          leadTime: safeNumber(row['Lead Time'] || row['LeadTime']),
          internalManufacturing: String(row['Internal Manufacturing'] || row['InternalManufacturing'] || 'NO').toLowerCase() === 'yes',
          purchase: String(row['Purchase Allowed'] || row['Purchase'] || 'YES').toLowerCase() === 'yes',
          internalNotes: safeString(row['Internal Notes'] || row['Notes'])
        };

        console.log(`Processing row ${rowNumber}:`, {
          originalName: row['Item Name'],
          originalCode: row['Item Code'], 
          parsedName: itemData.name,
          parsedCode: itemData.code,
          parsedType: itemData.type
        });

        // Validate required fields with better error messages
        if (!itemData.name) {
          throw new Error('Item name is required and cannot be empty');
        }

        // Ensure type has a valid value
        const validTypes = ['Product', 'Service', 'Raw Material', 'Finished Good'];
        if (!validTypes.includes(itemData.type)) {
          itemData.type = 'Product';
        }

        // Ensure importance has a valid value
        const validImportance = ['Low', 'Normal', 'High', 'Critical'];
        if (!validImportance.includes(itemData.importance)) {
          itemData.importance = 'Normal';
        }

        // Auto-generate code if not provided
        if (!itemData.code) {
          const prefix = itemData.type === 'Product' ? 'PRO' : 'SER';
          const count = await Item.countDocuments({ code: new RegExp(`^${prefix}\\d{4}$`) });
          itemData.code = `${prefix}${String(count + 1).padStart(4, '0')}`;
        }

        // Check for duplicate code and auto-generate new one if exists
        let existingItem = await Item.findOne({ code: itemData.code });
        if (existingItem) {
          console.log(`Code ${itemData.code} already exists, auto-generating new code...`);
          const prefix = itemData.type === 'Product' ? 'PRO' : 'SER';
          const count = await Item.countDocuments({ code: new RegExp(`^${prefix}\\d{4}$`) });
          itemData.code = `${prefix}${String(count + 1).padStart(4, '0')}`;
        }

        // Create new item
        const newItem = await Item.create(itemData);
        console.log(`Created new item: ${itemData.name} (${itemData.code}) - ID: ${newItem._id}`);

        results.successful++;
      } catch (rowError) {
        console.error(`Error processing row ${rowNumber}:`, rowError);
        results.errors.push(`Row ${rowNumber}: ${rowError.message}`);
        results.failed++;
      }
    }

    // Final verification
    const finalCount = await Item.countDocuments();
    console.log(`Final items in database after import: ${finalCount}`);
    
    res.json({
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      success: results.failed === 0,
      results,
      finalCount
    });

  } catch (error) {
    console.error('Error importing Excel file:', error);
    res.status(500).json({ 
      message: 'Error importing Excel file', 
      error: error.message,
      success: false
    });
  }
}];

// Export categories to Excel - Simplified implementation
export const exportCategoriesToExcel = async (req, res) => {
  try {
    console.log('Starting Excel export for categories');
    const categories = await Category.find({}).sort({ createdAt: -1 });
    console.log(`Found ${categories.length} categories to export`);
    
    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found to export', success: false });
    }

    const excelData = categories.map((category, index) => ({
      'Serial No': index + 1,
      'Category Name': category.name || '',
      'Description': category.description || '',
      'Subcategories': Array.isArray(category.subcategories) ? category.subcategories.join(', ') : '',
      'Created Date': category.createdAt ? category.createdAt.toISOString().split('T')[0] : ''
    }));

    const excelBuffer = createSimpleExcel(excelData, 'Categories');
    const filename = `categories_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

    console.log(`Categories Excel file sent: ${filename}`);

  } catch (error) {
    console.error('Categories Excel export error:', error);
    return res.status(500).json({ 
      message: 'Failed to export categories to Excel', 
      error: error.message,
      success: false 
    });
  }
};

// Export customer categories to Excel - Simplified implementation
export const exportCustomerCategoriesToExcel = async (req, res) => {
  try {
    console.log('Starting Excel export for customer categories');
    const customerCategories = await CustomerCategory.find({}).sort({ createdAt: -1 });
    console.log(`Found ${customerCategories.length} customer categories to export`);
    
    if (customerCategories.length === 0) {
      return res.status(404).json({ message: 'No customer categories found to export', success: false });
    }

    const excelData = customerCategories.map((category, index) => ({
      'Serial No': index + 1,
      'Category Name': category.name || '',
      'Description': category.description || '',
      'Created Date': category.createdAt ? category.createdAt.toISOString().split('T')[0] : ''
    }));

    const excelBuffer = createSimpleExcel(excelData, 'Customer Categories');
    const filename = `customer_categories_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

    console.log(`Customer categories Excel file sent: ${filename}`);

  } catch (error) {
    console.error('Customer categories Excel export error:', error);
    return res.status(500).json({ 
      message: 'Failed to export customer categories to Excel', 
      error: error.message,
      success: false 
    });
  }
};

// UTILITY CONTROLLERS
export const getLowStockItems = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const lowStockItems = await Item.find({
      $expr: { $lte: ['$qty', '$minStock'] }
    }).sort({ qty: 1 });

    res.json({ lowStockItems });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    if (!checkInventoryPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const stats = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$qty', '$stdCost'] } },
          totalQty: { $sum: '$qty' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$qty', '$minStock'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$qty', '$stdCost'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const typeStats = await Item.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$qty', '$stdCost'] } }
        }
      }
    ]);

    res.json({
      overview: stats[0] || { totalItems: 0, totalValue: 0, totalQty: 0, lowStockCount: 0 },
      categoryStats,
      typeStats
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};