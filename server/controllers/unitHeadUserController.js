import User from '../models/User.js';
import { USER_ROLES } from '../../shared/schema.js';
import bcrypt from 'bcryptjs';

// Get all Unit Managers under the current Unit Head
export const getUnitManagers = async (req, res) => {
  try {
    console.log('=== getUnitManagers API called ===');
    console.log('Query parameters:', req.query);
    console.log('Unit Head user:', req.user?.username, 'Unit:', req.user?.unit);
    
    const { 
      page = 1, 
      limit = 100,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'all'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Unit Head can only see Unit Managers from their own unit
    let query = {
      role: 'Unit Manager',
      unit: req.user.unit // Only show users from the same unit
    };

    // Filter by status
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch unit managers with pagination
    const unitManagers = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get summary statistics for this unit
    const stats = await User.aggregate([
      { $match: { unit: req.user.unit, role: 'Unit Manager' } },
      {
        $group: {
          _id: null,
          totalManagers: { $sum: 1 },
          activeManagers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveManagers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || { 
      totalManagers: 0, 
      activeManagers: 0, 
      inactiveManagers: 0 
    };

    console.log('=== getUnitManagers response ===');
    console.log('Total unit managers found:', total);
    console.log('Unit managers count:', unitManagers.length);

    res.json({
      success: true,
      data: {
        users: unitManagers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary,
        unit: req.user.unit
      }
    });
  } catch (error) {
    console.error('Get unit managers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unit managers', 
      error: error.message 
    });
  }
};

// Create a new Unit Manager (only Unit Heads can do this)
export const createUnitManager = async (req, res) => {
  try {
    console.log('=== createUnitManager API called ===');
    console.log('Request body:', req.body);
    
    const { username, email, password, fullName, permissions, isActive = true } = req.body;

    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and full name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new unit manager under the same unit as the Unit Head
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: 'Unit Manager', // Fixed role
      unit: req.user.unit, // Same unit as the Unit Head
      permissions: {
        role: 'unit_manager', // Required permissions.role field
        canAccessAllUnits: false,
        modules: permissions?.modules || [],
        ...permissions
      },
      isActive
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    console.log('=== Unit Manager created successfully ===');
    console.log('New user:', { id: newUser._id, username, role: 'Unit Manager', unit: req.user.unit });

    res.status(201).json({
      success: true,
      message: 'Unit Manager created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create unit manager error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create unit manager', 
      error: error.message 
    });
  }
};

// Update Unit Manager details and permissions
export const updateUnitManager = async (req, res) => {
  try {
    console.log('=== updateUnitManager API called ===');
    console.log('User ID:', req.params.userId);
    console.log('Request body:', req.body);
    
    const { userId } = req.params;
    const { username, email, fullName, permissions, isActive } = req.body;

    // Find the user and ensure they are a Unit Manager in the same unit
    const user = await User.findOne({
      _id: userId,
      role: 'Unit Manager',
      unit: req.user.unit
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Unit Manager not found or not in your unit'
      });
    }

    // Check if email/username is already taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (permissions) {
      user.permissions = {
        role: 'unit_manager', // Required permissions.role field
        canAccessAllUnits: false,
        modules: permissions?.modules || [],
        ...permissions
      };
    }
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('=== Unit Manager updated successfully ===');

    res.json({
      success: true,
      message: 'Unit Manager updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update unit manager error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update unit manager', 
      error: error.message 
    });
  }
};

// Update Unit Manager password
export const updateUnitManagerPassword = async (req, res) => {
  try {
    console.log('=== updateUnitManagerPassword API called ===');
    console.log('User ID:', req.params.userId);
    console.log('Unit Head:', req.user.username, 'Unit:', req.user.unit);
    
    const { userId } = req.params;
    const { newPassword } = req.body;

    console.log('Has newPassword:', !!newPassword);
    console.log('Password length:', newPassword ? newPassword.length : 0);

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find the user and ensure they are a Unit Manager in the same unit
    const user = await User.findOne({
      _id: userId,
      role: 'Unit Manager',
      unit: req.user.unit
    });

    if (!user) {
      console.log('Unit Manager not found or not in unit');
      return res.status(404).json({
        success: false,
        message: 'Unit Manager not found or not in your unit'
      });
    }

    console.log('Found Unit Manager:', user.username, 'Email:', user.email);

    // Hash the new password with bcrypt for encryption (same as admin API)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('Password hashed successfully with bcrypt');
    console.log('Hash length:', hashedPassword.length);
    
    // Verify the hash works before saving (important validation step)
    const hashTest = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Hash verification test:', hashTest);
    
    if (!hashTest) {
      throw new Error('Password hash verification failed');
    }
    
    // Update password using findByIdAndUpdate for consistency with admin API
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    console.log('=== Unit Manager password updated successfully ===');
    console.log('Updated user:', updatedUser.username);

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Update unit manager password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update password', 
      error: error.message 
    });
  }
};

// Delete/Deactivate Unit Manager
export const deleteUnitManager = async (req, res) => {
  try {
    console.log('=== deleteUnitManager API called ===');
    console.log('User ID:', req.params.userId);
    
    const { userId } = req.params;
    const { permanent = false } = req.body;

    // Find the user and ensure they are a Unit Manager in the same unit
    const user = await User.findOne({
      _id: userId,
      role: 'Unit Manager',
      unit: req.user.unit
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Unit Manager not found or not in your unit'
      });
    }

    if (permanent) {
      // Permanently delete the user
      await User.findByIdAndDelete(userId);
      console.log('=== Unit Manager deleted permanently ===');
      
      res.json({
        success: true,
        message: 'Unit Manager deleted permanently'
      });
    } else {
      // Just deactivate the user
      user.isActive = false;
      await user.save();
      
      console.log('=== Unit Manager deactivated ===');
      
      res.json({
        success: true,
        message: 'Unit Manager deactivated successfully',
        data: {
          _id: user._id,
          username: user.username,
          isActive: user.isActive
        }
      });
    }
  } catch (error) {
    console.error('Delete unit manager error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete unit manager', 
      error: error.message 
    });
  }
};

// Get Unit Manager by ID
export const getUnitManagerById = async (req, res) => {
  try {
    console.log('=== getUnitManagerById API called ===');
    console.log('User ID:', req.params.userId);
    
    const { userId } = req.params;

    // Find the user and ensure they are a Unit Manager in the same unit
    const user = await User.findOne({
      _id: userId,
      role: 'Unit Manager',
      unit: req.user.unit
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Unit Manager not found or not in your unit'
      });
    }

    console.log('=== Unit Manager found ===');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get unit manager by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unit manager', 
      error: error.message 
    });
  }
};

// Get available modules and permissions for Unit Manager role
export const getUnitManagerModules = async (req, res) => {
  try {
    console.log('=== getUnitManagerModules API called ===');
    
    // Define modules that Unit Managers can access
    const availableModules = [
      {
        name: 'sales',
        label: 'Sales',
        features: [
          { key: 'orders', label: 'View Orders' },
          { key: 'myOrders', label: 'My Orders' },
          { key: 'myCustomers', label: 'My Customers' },
          { key: 'salesApproval', label: 'Sales Approval' },
          { key: 'salesOrderList', label: 'Sales Order List' }
        ]
      },
      {
        name: 'production',
        label: 'Production',
        features: [
          { key: 'view', label: 'View Production' },
          { key: 'schedule', label: 'Production Schedule' },
          { key: 'quality', label: 'Quality Control' }
        ]
      },
      {
        name: 'inventory',
        label: 'Inventory',
        features: [
          { key: 'view', label: 'View Inventory' },
          { key: 'update', label: 'Update Stock' }
        ]
      },
      {
        name: 'reports',
        label: 'Reports',
        features: [
          { key: 'salesReport', label: 'Sales Reports' },
          { key: 'productionReport', label: 'Production Reports' }
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        modules: availableModules,
        roles: ['Unit Manager'], // Only Unit Manager role for this context
        units: [req.user.unit] // Only current unit
      }
    });
  } catch (error) {
    console.error('Get unit manager modules error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch modules', 
      error: error.message 
    });
  }
};