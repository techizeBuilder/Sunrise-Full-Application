import User from '../models/User.js';

// Function to update users with new permission structure
export const updatePermissionStructure = async () => {
  try {
    console.log('Starting permission structure update...');
    
    // Update Production role users - limit to only required features
    const productionPermissions = {
      name: 'production',
      dashboard: true,
      features: [
        { key: 'productionDashboard', view: true, add: true, edit: true, delete: true, alter: true },
        { key: 'productionReports', view: true, add: true, edit: true, delete: true, alter: true },
        { key: 'productionGroup', view: true, add: true, edit: true, delete: true, alter: true },
        { key: 'productionShift', view: true, add: true, edit: true, delete: true, alter: true }
      ]
    };

    // Update Production role users
    const productionUsers = await User.find({ role: 'Production' });
    for (const user of productionUsers) {
      // Remove all modules except dashboard and production
      user.permissions.modules = user.permissions.modules.filter(module => 
        module.name === 'dashboard'
      );
      
      // Add/update production module with limited features
      const productionModuleIndex = user.permissions.modules.findIndex(m => m.name === 'production');
      if (productionModuleIndex !== -1) {
        user.permissions.modules[productionModuleIndex] = productionPermissions;
      } else {
        user.permissions.modules.push(productionPermissions);
      }
      
      await user.save();
    }

    // Update Unit Manager users - add productionGroup feature
    const unitManagerUsers = await User.find({ role: 'Unit Manager' });
    for (const user of unitManagerUsers) {
      // Find or create unitManager module
      let unitManagerModule = user.permissions.modules.find(m => m.name === 'unitManager');
      if (!unitManagerModule) {
        unitManagerModule = {
          name: 'unitManager',
          dashboard: true,
          features: []
        };
        user.permissions.modules.push(unitManagerModule);
      }
      
      // Add productionGroup feature if not exists
      const hasProductionGroup = unitManagerModule.features.some(f => f.key === 'productionGroup');
      if (!hasProductionGroup) {
        unitManagerModule.features.push({
          key: 'productionGroup',
          view: true,
          add: true,
          edit: true,
          delete: true,
          alter: false
        });
        await user.save();
      }
    }

    // Update Unit Head users - add productionGroup feature
    const unitHeadUsers = await User.find({ role: 'Unit Head' });
    for (const user of unitHeadUsers) {
      // Find production module in Unit Head permissions
      let productionModule = user.permissions.modules.find(m => m.name === 'production');
      if (productionModule) {
        // Update production module to only include required features
        productionModule.features = [
          { key: 'productionDashboard', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionReports', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionGroup', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionShift', view: true, add: true, edit: true, delete: true, alter: true }
        ];
        await user.save();
      }
    }

    // Update Super Admin users - update production module features
    const superAdminUsers = await User.find({ role: 'Super Admin' });
    for (const user of superAdminUsers) {
      let productionModule = user.permissions.modules.find(m => m.name === 'production');
      if (productionModule) {
        // Update production module to only include required features
        productionModule.features = [
          { key: 'productionDashboard', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionReports', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionGroup', view: true, add: true, edit: true, delete: true, alter: true },
          { key: 'productionShift', view: true, add: true, edit: true, delete: true, alter: true }
        ];
        await user.save();
      }
    }

    console.log('Permission structure update completed');
    return {
      success: true,
      message: 'Permission structure updated successfully',
      updated: {
        production: productionUsers.length,
        unitManager: unitManagerUsers.length,
        unitHead: unitHeadUsers.length,
        superAdmin: superAdminUsers.length
      }
    };

  } catch (error) {
    console.error('Error updating permission structure:', error);
    return {
      success: false,
      message: 'Failed to update permission structure',
      error: error.message
    };
  }
};