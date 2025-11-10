import { Company } from '../models/Company.js';

// Helper function to check company permissions
const checkCompanyPermission = (user, action) => {
  console.log('Checking company permission for user:', user?.role, 'action:', action);
  
  // Super User has all permissions
  if (user?.role === 'Super User') {
    return true;
  }
  // Unit Head has all company permissions
  if (user?.role === 'Unit Head') {
    return true;
  }
  return user?.permissions?.Company?.[action] === true;
};

// Get all companies with filters
export const getCompanies = async (req, res) => {
  try {
    console.log('Get companies request from user:', req.user?.role);
    
    if (!checkCompanyPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { city, unitName, name, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (unitName) filter.unitName = new RegExp(unitName, 'i');
    if (name) filter.name = new RegExp(name, 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get companies with pagination
    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Company.countDocuments(filter);

    console.log(`Found ${companies.length} companies, total: ${total}`);

    res.json({
      companies,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new company
export const createCompany = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'create')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const companyData = req.body;

    // Validate required fields
    const requiredFields = ['unitName', 'name', 'mobile', 'email', 'address', 'locationPin', 'city', 'state', 'gst', 'orderCutoffTime'];
    const missingFields = requiredFields.filter(field => !companyData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields', 
        missingFields,
        errors: missingFields.reduce((acc, field) => {
          acc[field] = `${field} is required`;
          return acc;
        }, {})
      });
    }

    // Additional validation
    if (companyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: { email: 'Please provide a valid email address' }
      });
    }

    if (companyData.mobile && !/^[\+]?[1-9][\d]{0,15}$/.test(companyData.mobile.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format',
        errors: { mobile: 'Please provide a valid mobile number' }
      });
    }

    if (companyData.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(companyData.gst)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST number format',
        errors: { gst: 'Please provide a valid GST number (e.g., 07AABCT1234H1Z5)' }
      });
    }

    if (companyData.locationPin && !/^[1-9][0-9]{5}$/.test(companyData.locationPin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code format',
        errors: { locationPin: 'Please provide a valid 6-digit PIN code' }
      });
    }

    // Check if company with same GST already exists
    const existingCompany = await Company.findOne({ gst: companyData.gst.toUpperCase() });
    if (existingCompany) {
      return res.status(400).json({ 
        success: false,
        message: 'Company with this GST number already exists' 
      });
    }

    // Create company
    const company = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Create company error:', error);
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: 'Company with this information already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  }
};

// Update company
export const updateCompany = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'edit')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if updating GST and it conflicts with another company
    if (updateData.gst) {
      const existingCompany = await Company.findOne({ 
        gst: updateData.gst.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCompany) {
        return res.status(400).json({ 
          success: false,
          message: 'Another company with this GST number already exists' 
        });
      }
    }

    const company = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'delete')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ 
      success: true,
      message: 'Company deleted successfully' 
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Get company statistics
export const getCompanyStats = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const totalCompanies = await Company.countDocuments();
    const companiesByCity = await Company.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const companiesByUnit = await Company.aggregate([
      {
        $group: {
          _id: '$unitName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      total: totalCompanies,
      byCity: companiesByCity,
      byUnit: companiesByUnit
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};