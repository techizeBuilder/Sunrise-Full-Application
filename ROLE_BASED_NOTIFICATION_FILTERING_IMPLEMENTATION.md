# Role-Based Notification Filtering Implementation

## 🎯 Problem Solved

**Issue**: All notifications were being shown to all users regardless of their role, unit, or company assignment.

**Solution**: Implemented comprehensive role-based and unit/company-based filtering for notifications.

## 🔧 Implementation Details

### 1. **Database Schema Updates**

#### Updated Notification Model (`server/models/Notification.js`)
```javascript
// NEW FIELDS ADDED
targetUnit: {
  type: String,
  default: null
},
targetCompanyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  default: null
},

// UPDATED ROLE ENUM
targetRole: {
  type: String,
  enum: ['Super Admin', 'Unit Head', 'Unit Manager', 'Sales', 'Production', 'Manufacturing', 'Packing', 'Dispatch', 'Accounts', 'all'],
  default: 'all'
},
```

#### New Database Indexes
- `targetUnit` + `createdAt`
- `targetCompanyId` + `createdAt`
- Compound indexes for efficient role-based filtering

### 2. **Filtering Logic Implementation**

#### Role-Based Access Rules

| Role | Access Level | Filtering |
|------|--------------|-----------|
| **Super Admin** | All notifications | No filtering applied |
| **Unit Head** | Unit-specific + Global | `targetUnit` = user.unit OR `targetCompanyId` = user.companyId OR global |
| **Unit Manager** | Unit-specific + Global | `targetUnit` = user.unit OR `targetCompanyId` = user.companyId OR global |
| **Sales** | Unit-specific + Global | `targetUnit` = user.unit OR `targetCompanyId` = user.companyId OR global |
| **Production** | Unit-specific + Global | `targetUnit` = user.unit OR `targetCompanyId` = user.companyId OR global |
| **Other Roles** | Unit-specific + Global | `targetUnit` = user.unit OR `targetCompanyId` = user.companyId OR global |

### 3. **Service Layer Updates**

#### Updated NotificationService (`server/services/notificationService.js`)

**Key Functions Updated:**
- `getUserNotifications()` - Now accepts `userUnit` and `userCompanyId`
- `getUnreadCount()` - Role-based filtering for count
- `markAllAsRead()` - Only marks notifications user can see
- `createNotification()` - Supports `targetUnit` and `targetCompanyId`

**Filtering Logic:**
```javascript
// Role-based filtering example
if (userRole === 'Unit Head' || userRole === 'Unit Manager' || userRole === 'Sales') {
  const unitCompanyFilters = [];
  
  if (userUnit) {
    unitCompanyFilters.push({ targetUnit: userUnit });
  }
  
  if (userCompanyId) {
    unitCompanyFilters.push({ targetCompanyId: userCompanyId });
  }
  
  // Include global notifications
  unitCompanyFilters.push({ targetUnit: null, targetCompanyId: null });
  
  query.$and.push({ $or: unitCompanyFilters });
}
```

### 4. **API Controller Updates**

#### Updated NotificationController (`server/controllers/notificationController.js`)

All controller functions now pass user context:
```javascript
const userId = req.user._id;
const userRole = req.user.role;
const userUnit = req.user.unit;
const userCompanyId = req.user.companyId;

const result = await notificationService.getUserNotifications(
  userId, userRole, userUnit, userCompanyId, options
);
```

### 5. **Enhanced Notification Creation**

#### New Helper Methods
```javascript
// Create unit-specific notification
await notificationService.createUnitNotification({
  title: 'Unit-Specific Alert',
  message: 'This alert is only for your unit',
  targetRole: 'Unit Manager',
  targetUnit: 'Unit A',
  targetCompanyId: 'company_id_here'
});

// Create company-wide notification
await notificationService.triggerInventoryNotification(
  itemData, 
  'updated', 
  null, // no specific unit
  'company_id_here' // company-wide
);
```

## 🧪 Testing the Implementation

### Test Case 1: Create Unit-Specific Notification
```javascript
// POST /api/notifications/test
{
  "title": "Unit Manager Alert",
  "message": "This is only for Unit A managers",
  "targetRole": "Unit Manager",
  "targetUnit": "Unit A"
}
```

### Test Case 2: Create Company-Specific Notification
```javascript
// POST /api/notifications/test
{
  "title": "Company-Wide Alert",
  "message": "This is for all users in Sunrize Bakery",
  "targetRole": "all",
  "targetCompanyId": "691409118cf85f80ad856b9"
}
```

### Test Case 3: Role-Specific Global Notification
```javascript
// POST /api/notifications/test
{
  "title": "All Sales Staff",
  "message": "This is for all sales staff across all units",
  "targetRole": "Sales"
}
```

## 📊 Expected Behavior

### Admin User
- **Sees**: ALL notifications (no filtering)
- **Notification Count**: Total count of all notifications

### Unit Head (Unit A, Company X)
- **Sees**: 
  - Notifications targeted to `targetRole: 'Unit Head'`
  - Notifications with `targetUnit: 'Unit A'`
  - Notifications with `targetCompanyId: 'Company X'`
  - Global notifications (`targetUnit: null, targetCompanyId: null`)
- **Doesn't See**: Notifications for other units/companies

### Unit Manager (Unit A, Company X)
- **Sees**: Same as Unit Head but filtered for `targetRole: 'Unit Manager'`

### Sales (Unit A, Company X)
- **Sees**: Same filtering logic but for `targetRole: 'Sales'`

## 🔍 Database Query Examples

### Query for Unit Head in "Unit A"
```mongodb
{
  $and: [
    {
      $or: [
        { targetRole: 'all' },
        { targetRole: 'Unit Head' },
        { targetUserId: ObjectId('user_id') }
      ]
    },
    {
      $or: [
        { targetUnit: 'Unit A' },
        { targetCompanyId: ObjectId('company_id') },
        { targetUnit: null, targetCompanyId: null }
      ]
    }
  ]
}
```

## 🚀 Benefits

1. **Privacy**: Users only see notifications relevant to them
2. **Performance**: Reduced notification noise and load
3. **Security**: Unit-specific information stays within units
4. **Scalability**: Can handle multi-unit, multi-company scenarios
5. **Flexibility**: Admins can create targeted notifications

## 🔧 Migration Notes

**Existing Notifications**: All existing notifications will be treated as global (no `targetUnit` or `targetCompanyId`) and will be visible to all users until new targeted notifications are created.

**Backward Compatibility**: The system maintains full backward compatibility with existing notification creation methods.

## 📋 Summary

The implementation successfully addresses the notification filtering requirements:

✅ **Admin** sees all notifications  
✅ **Unit Head** sees only their unit's notifications + global  
✅ **Unit Manager** sees only their unit's notifications + global  
✅ **Sales** sees only their unit's notifications + global  
✅ **All other roles** follow the same unit-based filtering pattern  

The system now properly isolates notifications by organizational structure while maintaining admin oversight capabilities.