// Middleware to check action-level permissions
export const checkPermission = (module, feature, action) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Authentication required',
          success: false 
        });
      }

      // Super User has all permissions
      if (user.role === 'Super User' || user.permissions?.role === 'super_user') {
        return next();
      }

      // Check if user has permissions structure
      if (!user.permissions || !user.permissions.modules) {
        return res.status(403).json({ 
          message: 'Access denied - No permissions configured',
          success: false 
        });
      }

      // Find the module in user permissions
      const userModule = user.permissions.modules.find(m => m.name === module);
      
      if (!userModule) {
        return res.status(403).json({ 
          message: `Access denied - No access to ${module} module`,
          success: false 
        });
      }

      // Find the feature in module
      const userFeature = userModule.features.find(f => f.key === feature);
      
      if (!userFeature) {
        return res.status(403).json({ 
          message: `Access denied - No access to ${feature} feature`,
          success: false 
        });
      }

      // Check if user has the required action permission
      if (!userFeature[action]) {
        return res.status(403).json({ 
          message: `Access denied - No ${action} permission for ${feature}`,
          success: false 
        });
      }

      // Permission granted
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        message: 'Internal server error during permission check',
        success: false 
      });
    }
  };
};

// Get user modules based on role
export const getUserModules = (role) => {
  const moduleMap = {
    'Super User': ['Dashboard', 'Manufacturing', 'Dispatches', 'Sales', 'Accounts', 'Inventory', 'Customers', 'Suppliers', 'Purchases', 'Settings'],
    'Unit Head': ['Dashboard', 'Manufacturing', 'Dispatches', 'Sales', 'Accounts', 'Inventory', 'Customers'],
    'Unit Manager': ['Dashboard', 'Sales Approval', 'Manufacturing', 'Dispatches', 'Inventory'],
    'Production': ['Dashboard', 'Manufacturing'],
    'Packing': ['Dashboard', 'Manufacturing', 'Dispatches'],
    'Dispatch': ['Dashboard', 'Dispatches'],
    'Accounts': ['Dashboard', 'Accounts', 'Sales'],
    'Sales': ['Dashboard', 'Sales', 'Customers']
  };
  
  return moduleMap[role] || ['Dashboard'];
};

// Helper function to check if user can access all units
export const checkUnitAccess = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      success: false 
    });
  }

  // Super User can access all units
  if (user.role === 'Super User' || user.permissions?.canAccessAllUnits) {
    return next();
  }

  // For unit-specific access, you can add unit filtering logic here
  // For now, we'll allow access but you can implement unit-based filtering
  next();
};

// Get user permissions for frontend
export const getUserPermissions = (user) => {
  if (!user) return null;

  // Super User gets all permissions
  if (user.role === 'Super User') {
    return {
      role: 'super_user',
      canAccessAllUnits: true,
      modules: [
        {
          name: 'dashboard',
          dashboard: true,
          features: [
            { key: 'overview', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'analytics', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'orders',
          dashboard: true,
          features: [
            { key: 'allOrders', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'orderReport', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'sales',
          dashboard: true,
          features: [
            { key: 'myIndent', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'myCustomers', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'myDeliveries', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'myInvoices', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'myLedger', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'dispatches',
          dashboard: true,
          features: [
            { key: 'dispatchNotes', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'proofOfDelivery', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'accounts',
          dashboard: true,
          features: [
            { key: 'paymentRegister', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'creditNotes', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'ledgerReport', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'inventory',
          dashboard: true,
          features: [
            { key: 'items', view: true, add: true, edit: true, delete: true, alter: true },
            { key: 'categories', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'customers',
          dashboard: true,
          features: [
            { key: 'addEditView', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'suppliers',
          dashboard: true,
          features: [
            { key: 'addEditView', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'purchases',
          dashboard: true,
          features: [
            { key: 'allPurchases', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        },
        {
          name: 'manufacturing',
          dashboard: true,
          features: [
            { key: 'allJobs', view: true, add: true, edit: true, delete: true, alter: true }
          ]
        }
      ]
    };
  }

  // Unit Manager gets permissions for sales management and production oversight
  if (user.role === 'Unit Manager') {
    return {
      role: 'unit_manager',
      canAccessAllUnits: true,
      modules: [
        {
          name: 'dashboard',
          dashboard: true,
          features: [
            { key: 'overview', view: true, add: false, edit: false, delete: false, alter: false },
            { key: 'analytics', view: true, add: false, edit: false, delete: false, alter: false }
          ]
        },
        {
          name: 'sales_approval',
          dashboard: true,
          features: [
            { key: 'orders', view: true, add: false, edit: true, delete: false, alter: true },
            { key: 'approval_workflow', view: true, add: false, edit: true, delete: false, alter: true }
          ]
        },
        {
          name: 'manufacturing',
          dashboard: true,
          features: [
            { key: 'allJobs', view: true, add: false, edit: true, delete: false, alter: true }
          ]
        },
        {
          name: 'dispatches',
          dashboard: true,
          features: [
            { key: 'dispatchNotes', view: true, add: false, edit: false, delete: false, alter: false },
            { key: 'proofOfDelivery', view: true, add: false, edit: false, delete: false, alter: false }
          ]
        },
        {
          name: 'inventory',
          dashboard: true,
          features: [
            { key: 'items', view: true, add: false, edit: false, delete: false, alter: false },
            { key: 'categories', view: true, add: false, edit: false, delete: false, alter: false }
          ]
        }
      ]
    };
  }

  // Return user's specific permissions for other roles
  return user.permissions || {
    role: user.role.toLowerCase().replace(' ', '_'),
    canAccessAllUnits: false,
    modules: []
  };
};