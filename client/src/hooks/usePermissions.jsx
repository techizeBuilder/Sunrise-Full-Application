import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  // Check if user has access to a specific module
  const hasModuleAccess = (moduleName) => {
    if (!user || !user.permissions) return false;
    
    // Super User has access to everything
    if (user.role === 'Super User') return true;
    
    // Special handling for Unit Head role
    if (user.role === 'Unit Head') {
      // Unit Head has permissions stored in unitHead module with features representing different modules
      const unitHeadModule = user.permissions.modules?.find(module => module.name === 'unitHead');
      if (unitHeadModule) {
        // Check if the requested module exists as a feature with at least view permission
        const moduleFeature = unitHeadModule.features?.find(feature => feature.key === moduleName);
        return moduleFeature && moduleFeature.view;
      }
    }
    
    // For other roles, check direct module access
    if (Array.isArray(user.permissions)) {
      // Simple array of module names
      return user.permissions.includes(moduleName);
    } else if (user.permissions && typeof user.permissions === 'object') {
      // Complex permissions object - check if it has modules array
      if (Array.isArray(user.permissions.modules)) {
        return user.permissions.modules.some(module => module.name === moduleName);
      } else if (user.permissions.some && typeof user.permissions.some === 'function') {
        // Legacy format - array-like permissions
        return user.permissions.some(permission => {
          if (typeof permission === 'string') {
            return permission === moduleName;
          }
          return permission.module === moduleName && permission.access;
        });
      }
    }
    
    return false;
  };  // Check if user has specific feature access with action
  const hasFeatureAccess = (moduleName, featureKey, action = 'view') => {
    if (!user || !user.permissions) return false;
    
    // Super User has access to everything
    if (user.role === 'Super User') return true;
    
    // Special handling for Unit Head role
    if (user.role === 'Unit Head') {
      const unitHeadModule = user.permissions.modules?.find(module => module.name === 'unitHead');
      if (unitHeadModule) {
        // For Unit Head, the module names are stored as feature keys
        const moduleFeature = unitHeadModule.features?.find(feature => feature.key === moduleName);
        if (moduleFeature) {
          return moduleFeature[action] || false;
        }
      }
    }
    
    // For other roles, check direct module access
    const userModule = user.permissions.modules?.find(module => 
      module.name === moduleName
    );
    
    if (!userModule) return false;
    
    const feature = userModule.features?.find(f => f.key === featureKey);
    if (!feature) return false;
    
    return feature[action] || false;
  };

  // Get all accessible modules for sidebar rendering
  const getAccessibleModules = () => {
    if (!user || !user.permissions) return [];
    
    // Super User gets all modules
    if (user.role === 'Super User') {
      return [
        'dashboard', 'orders', 'manufacturing', 'production', 'dispatches', 
        'sales', 'accounts', 'inventory', 'customers', 
        'suppliers', 'purchases'
      ];
    }
    
    // Special handling for Unit Head role
    if (user.role === 'Unit Head') {
      const unitHeadModule = user.permissions.modules?.find(module => module.name === 'unitHead');
      if (unitHeadModule) {
        // Return the feature keys (which represent module names) that have at least view permission
        return unitHeadModule.features
          ?.filter(feature => feature.view)
          ?.map(feature => feature.key) || [];
      }
    }
    
    // For other roles, return modules they have access to
    return user.permissions.modules
      ?.filter(module => module.dashboard)
      ?.map(module => module.name) || [];
  };

  // Get submodules/features for a specific module
  const getModuleFeatures = (moduleName) => {
    if (!user || !user.permissions) return [];
    
    const normalizedModuleName = moduleName?.toLowerCase();
    const userModule = user.permissions.modules?.find(module => 
      module.name === normalizedModuleName
    );
    
    return userModule?.features || [];
  };

  // Check specific action permission
  const canPerformAction = (moduleName, featureKey, action) => {
    return hasFeatureAccess(moduleName, featureKey, action);
  };

  // Check if user can manage users (for backwards compatibility)
  const canManageUsers = () => {
    return user && ['Super User', 'Unit Head'].includes(user.role);
  };

  // Check if user can access settings (for backwards compatibility)
  const canAccessSettings = () => {
    return user && user.role === 'Super User';
  };

  // Check if user can access all units
  const canAccessAllUnits = () => {
    if (!user || !user.permissions) return false;
    return user.role === 'Super User' || user.permissions.canAccessAllUnits;
  };

  // Get user's permission role
  const getPermissionRole = () => {
    return user?.permissions?.role || user?.role?.toLowerCase().replace(' ', '_');
  };

  return {
    hasModuleAccess,
    hasFeatureAccess,
    getAccessibleModules,
    getModuleFeatures,
    canPerformAction,
    canManageUsers,
    canAccessSettings,
    canAccessAllUnits,
    getPermissionRole,
    // Legacy support
    hasPermission: hasFeatureAccess,
    getUserModules: getAccessibleModules
  };
};