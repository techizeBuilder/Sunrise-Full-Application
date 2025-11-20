# Unit Head Default Permissions Update

## Summary
Updated Unit Head role to have **ALL PERMISSIONS** selected by default instead of just "View" permissions.

## Changes Made

### 1. Frontend Permission Defaults
**File**: `client/src/pages/RolePermissionManagement.jsx`
- Updated `getDefaultModulesForRole()` function for Unit Head
- **Before**: Only `view: true`, all other permissions `false`
- **After**: All permissions `true` (view, add, edit, delete, alter)

### 2. Seed Data Update
**File**: `server/seed/seedUsers.js`
- Updated default Unit Head permissions in seeder
- Ensures new installations have correct default permissions

### 3. Database Migration Script
**File**: `server/scripts/updateUnitHeadPermissions.js`
- Created migration script to update existing Unit Head users
- Updates all existing Unit Head users to have full permissions

## Default Permissions for Unit Head

When Unit Head role is selected, the following modules automatically get **FULL ACCESS**:

### Core Modules (All with View/Add/Edit/Delete)
- ✅ Dashboard
- ✅ Orders  
- ✅ Sales
- ✅ Dispatches
- ✅ Accounts
- ✅ Inventory
- ✅ Customers
- ✅ Suppliers
- ✅ Purchases
- ✅ Manufacturing
- ✅ Production
- ✅ User Management

### Permission Structure
```javascript
{
  role: 'unit_head',
  canAccessAllUnits: false,
  modules: [
    {
      name: 'unitHead',
      dashboard: true,
      features: [
        { key: 'dashboard', view: true, add: true, edit: true, delete: true, alter: true },
        { key: 'orders', view: true, add: true, edit: true, delete: true, alter: true },
        // ... all other features with full permissions
      ]
    }
  ]
}
```

## How to Apply Changes

### For New Unit Head Users
- Changes are automatically applied when creating new Unit Head users
- No manual action required

### For Existing Unit Head Users
Run the migration script:
```bash
cd server
node scripts/updateUnitHeadPermissions.js --execute
```

## Impact
- Unit Heads now have complete administrative control over their units
- Can fully manage all operations: Orders, Sales, Inventory, Users, etc.
- Maintains company/unit isolation (only manages their assigned unit)
- Provides appropriate level of authority for Unit Head role

## User Interface
In the Role Permission Management interface:
- When "Unit Head" is selected as role
- All permission toggles (View/Add/Edit/Delete) are automatically enabled
- User can still manually adjust permissions if needed
- Bulk "Enable All" and "Disable All" buttons available

## Security Notes
- Unit Heads still restricted to their assigned company/unit
- Cannot access other companies' data
- Super Admin retains highest level access
- Role-based access control maintained throughout application