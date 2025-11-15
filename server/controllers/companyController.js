import { Company } from '../models/Company.js';

// Helper function to check company permissions
const checkCompanyPermission = (user, action) => {
  console.log('Checking company permission for user:', user?.role, 'action:', action);
  
  // Super Admin has all permissions
  if (user?.role === 'Super Admin') {
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

    const { 
      city, 
      unitName, 
      name, 
      state,
      isActive,
      search,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Individual field filters
    if (city) filter.city = new RegExp(city, 'i');
    if (unitName) filter.unitName = new RegExp(unitName, 'i');
    if (name) filter.name = new RegExp(name, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Global search across multiple fields
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { unitName: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { state: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get companies with pagination
    const companies = await Company.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Company.countDocuments(filter);

    // Get unique cities for filter options
    const cities = await Company.distinct('city', { isActive: true });
    const states = await Company.distinct('state', { isActive: true });

    console.log(`Found ${companies.length} companies, total: ${total}`);

    res.json({
      success: true,
      companies,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        hasNext: skip + companies.length < total,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        cities: cities.sort(),
        states: states.sort()
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
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

    // Auto-generate name from unitName if not provided
    if (!companyData.name && companyData.unitName) {
      companyData.name = companyData.unitName;
    }

    // Validate required fields (name is now optional as it can be auto-generated)
    const requiredFields = ['unitName', 'locationPin', 'city', 'state'];
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

    // Additional validation (only validate if fields are provided)
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

    if (companyData.locationPin && !/^[1-9][0-9]{5}$/.test(companyData.locationPin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code format',
        errors: { locationPin: 'Please provide a valid 6-digit PIN code' }
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

    // Auto-generate name from unitName if name is not provided but unitName is
    if (!updateData.name && updateData.unitName) {
      updateData.name = updateData.unitName;
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

    const totalCompanies = await Company.countDocuments({ isActive: true });
    const companiesByCity = await Company.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const companiesByUnit = await Company.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$unitName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      total: totalCompanies,
      byCity: companiesByCity,
      byUnit: companiesByUnit
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Get companies for dropdown/select options
export const getCompaniesDropdown = async (req, res) => {
  try {
    if (!checkCompanyPermission(req.user, 'view')) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { city, unitName, search } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (city) filter.city = new RegExp(city, 'i');
    if (unitName) filter.unitName = new RegExp(unitName, 'i');
    
    // Global search
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { unitName: new RegExp(search, 'i') }
      ];
    }

    const companies = await Company.find(filter)
      .select('_id name city state unitName')
      .sort({ name: 1, city: 1 })
      .limit(100); // Limit for dropdown performance

    // Format for dropdown
    const dropdownOptions = companies.map(company => ({
      value: company._id,
      label: `${company.name} - ${company.city}, ${company.state}`,
      name: company.name,
      city: company.city,
      state: company.state,
      unitName: company.unitName
    }));

    res.json({
      success: true,
      companies: dropdownOptions,
      count: dropdownOptions.length
    });
  } catch (error) {
    console.error('Get companies dropdown error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Simple companies list for public/reusable access (no authentication required)
export const getCompaniesSimple = async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    
    // Build filter object - only active companies
    const filter = { isActive: true };
    
    // Global search
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { unitName: new RegExp(search, 'i') }
      ];
    }

    const companies = await Company.find(filter)
      .select('_id name city state unitName companyType')
      .sort({ name: 1, city: 1 })
      .limit(parseInt(limit));

    // Format for dropdown with consistent structure
    const simpleList = companies.map(company => ({
      value: company._id.toString(),
      label: `${company.name} - ${company.city}, ${company.state}`,
      name: company.name,
      city: company.city,
      state: company.state,
      unitName: company.unitName,
      companyType: company.companyType
    }));

    res.json({
      success: true,
      companies: simpleList,
      count: simpleList.length
    });
  } catch (error) {
    console.error('Get companies simple error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};