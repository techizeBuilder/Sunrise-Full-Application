# Customer API Integration Summary

## 📋 Overview

This document outlines the customer API endpoints and their proper integration in the frontend application.

## 🎯 API Endpoints

### 1. Global Customer API
- **Endpoint**: `/api/customers`
- **Purpose**: Administrative customer management
- **Access**: All authenticated users with appropriate permissions
- **Filtering**: 
  - Super Admin: ALL customers from all companies
  - Other roles: ALL customers from their company only
- **Usage**: Admin dashboards, global customer management

### 2. Sales Customer API
- **Endpoint**: `/api/sales/customers`
- **Purpose**: Sales-specific customer access
- **Access**: Sales, Unit Manager, Super Admin only
- **Filtering**:
  - Sales role: ONLY customers assigned to that salesperson
  - Unit Manager: ALL customers from their company
  - Super Admin: ALL customers from all companies
- **Usage**: Sales dashboards, order creation, sales workflows

### 3. Legacy Sales API
- **Endpoint**: `/api/sales/my-customers`
- **Purpose**: Backward compatibility
- **Access**: Same as sales customer API
- **Note**: Will be deprecated in favor of `/api/sales/customers`

## 🔧 Frontend Implementation

### Updated Files

#### 1. Sales Service (`client/src/api/salesService.js`)
```javascript
// New unified endpoint
getCustomers: (params = {}) => {
  // Uses /sales/customers
}

// Existing endpoint (maintained for compatibility)
getMyCustomers: (params = {}) => {
  // Uses /sales/my-customers
}
```

#### 2. Sales Pages Updates

**MyIndent.jsx**: ✅ Updated
- Changed from global customer API to sales-specific API
- Now uses `salesApi.getCustomers()`

**MyCustomers.jsx**: ✅ Updated
- Cache invalidation updated to use sales-specific keys
- Already using sales-specific query endpoints

**RefundDamage.jsx**: ✅ Already correct
- Already using sales-specific endpoints

#### 3. Global Customer Pages

**Customers.jsx**: ✅ Kept unchanged
- Continues using global `/api/customers`
- Appropriate for admin/manager access

## 🎛️ Usage Guidelines

### For Sales Components
```javascript
// ✅ Correct - Use sales API
import { salesApi } from '@/api/salesService';

const { data } = useQuery({
  queryKey: ['/api/sales/customers'],
  queryFn: () => salesApi.getCustomers(params)
});
```

### For Admin Components
```javascript
// ✅ Correct - Use global API
import { customerApi } from '@/api/customerService';

const { data } = useQuery({
  queryKey: ['/api/customers'],
  queryFn: () => customerApi.getAll(params)
});
```

### Cache Invalidation
```javascript
// For sales components
queryClient.invalidateQueries(['/api/sales/customers']);
queryClient.invalidateQueries(['/api/sales/my-customers']);

// For admin components
queryClient.invalidateQueries(['/api/customers']);
```

## 🔐 Security & Permissions

- **Company Isolation**: All APIs enforce company-level data isolation
- **Role-Based Access**: Sales personnel see only assigned customers
- **Authentication**: JWT token required for all endpoints
- **Authorization**: Role-specific middleware enforces permissions

## 🚀 Benefits

1. **Data Security**: Sales personnel cannot access other salesperson's customers
2. **Performance**: Reduced data transfer for sales endpoints
3. **Scalability**: Separate endpoints for different use cases
4. **Maintainability**: Clear separation of concerns
5. **Backward Compatibility**: Existing global API unchanged

## 🧪 Testing

Use the provided test script (`test-customer-apis.js`) to verify:
1. Global API returns appropriate data based on user role
2. Sales API properly filters customers by assignment
3. All authentication and authorization work correctly

## 📝 Migration Notes

- All sales-related components now use sales-specific customer API
- Global customer management remains unchanged
- Cache invalidation patterns updated for consistency
- No breaking changes to existing admin functionality

## 🔄 Next Steps

1. Test all customer-related functionality in sales modules
2. Verify admin customer management still works correctly
3. Monitor API performance and data filtering
4. Consider deprecating `/api/sales/my-customers` in future versions