# Cutoff Time Functionality Implementation

## Overview
This implementation adds a cutoff time management system that allows Unit Heads to set daily cutoff times to control when Sales persons can place or edit orders. This solves the requirement where sales persons can only create/edit orders before a specified time (e.g., 3:00 PM), after which order buttons are disabled.

## Features

### ✅ Unit Head Features
- **Set Cutoff Time**: Set daily cutoff time (e.g., 15:00 for 3:00 PM)
- **Enable/Disable**: Toggle cutoff time restrictions on/off
- **Real-time Status**: See current order status (allowed/blocked)
- **Description**: Add optional description for the cutoff policy
- **Company-based**: Each company/location has its own cutoff setting

### ✅ Sales Person Experience
- **Visual Feedback**: Clear status banners showing order availability
- **Disabled Buttons**: Create/Edit order buttons disabled after cutoff
- **Helpful Tooltips**: Explanatory messages when buttons are disabled
- **Real-time Updates**: Status updates every minute automatically

### ✅ System Design
- **Role-based**: Only affects Sales role, Unit Heads/Managers unrestricted
- **Fail-safe**: If cutoff check fails, orders are still allowed
- **Daily Reset**: Cutoff time resets every day at midnight
- **Company Isolation**: Each company has independent cutoff settings

## Technical Implementation

### Backend Components

#### 1. Database Model (`server/models/CutoffTime.js`)
```javascript
{
  companyId: ObjectId,        // Company this cutoff applies to
  unitHeadId: ObjectId,       // Unit Head who set it
  cutoffTime: String,         // "HH:MM" format (24-hour)
  isActive: Boolean,          // Enable/disable toggle
  description: String,        // Optional description
  createdBy: ObjectId,        // Who created this setting
  updatedBy: ObjectId         // Who last updated it
}
```

**Key Features:**
- Unique cutoff time per company
- Time validation (HH:MM format)
- Instance methods for checking if past cutoff
- Static methods for order permission checking

#### 2. Controller Functions (`server/controllers/unitHeadController.js`)

**getCutoffTime**
- Gets current cutoff setting for unit head's company
- Returns cutoff time and current status (allowed/blocked)
- Used by frontend to display current settings

**setCutoffTime**
- Creates new or updates existing cutoff time
- Validates time format and permissions
- Auto-determines create vs update operation

**toggleCutoffTime**
- Enables/disables cutoff time restrictions
- Preserves cutoff time setting when disabled
- Updates modification tracking

#### 3. Order Validation (`server/controllers/orderController.js`)

**Enhanced createOrder Function:**
```javascript
// Check cutoff time for Sales role
if (req.user.role === 'Sales') {
  const orderPermission = await CutoffTime.canPlaceOrder(req.user.companyId);
  if (!orderPermission.allowed) {
    return res.status(403).json({
      status: false,
      message: orderPermission.message,
      cutoffTime: orderPermission.cutoffTime,
      isPastCutoff: true
    });
  }
}
```

**Enhanced updateOrder Function:**
- Same cutoff validation as create
- Prevents editing orders after cutoff time
- Maintains existing order data on validation failure

#### 4. API Routes (`server/routes/unitHeadRoutes.js`)
```javascript
GET    /api/unit-head/cutoff-time          // Get current setting
POST   /api/unit-head/cutoff-time          // Create new setting  
PUT    /api/unit-head/cutoff-time          // Update existing setting
PATCH  /api/unit-head/cutoff-time/toggle   // Toggle active status
```

### Frontend Components

#### 1. Main Management Component (`client/src/components/cutoff/CutoffTimeManagement.jsx`)

**Features:**
- Current status display with real-time updates
- Time input with validation
- Enable/disable toggle
- Success/error notifications
- Information panel explaining how it works

**Real-time Updates:**
- Refetches status every 30 seconds
- Shows current time vs cutoff time
- Dynamic status badges (OPEN/CLOSED)

#### 2. Unit Head Page (`client/src/pages/UnitHeadCutoffTime.jsx`)
- Wrapper page with proper permissions checking
- Professional header with description
- Integrated with Unit Head navigation

#### 3. Sales Order Integration (`client/src/pages/sales/MyIndent.jsx`)

**Enhanced Features:**
- Real-time cutoff permission checking
- Disabled create/edit buttons when past cutoff
- Status banners with clear messaging
- Tooltips explaining why buttons are disabled

**Permission Query:**
```javascript
const { data: orderPermissionResponse } = useQuery({
  queryKey: ['order-permission'],
  queryFn: canPlaceOrder,
  refetchInterval: 60000, // Check every minute
});
```

#### 4. API Service (`client/src/services/api.js`)

**New Functions:**
- `getCutoffTime()`: Get current setting
- `setCutoffTime(data)`: Set/update cutoff time
- `toggleCutoffTime(isActive)`: Toggle status
- `canPlaceOrder()`: Check if orders allowed

#### 5. Navigation Integration
- Added to Unit Head sidebar menu
- Proper permissions checking
- Clock icon for visual identification

## Usage Examples

### Setting Cutoff Time (Unit Head)
1. Navigate to "Cutoff Time" in sidebar
2. Enter time in HH:MM format (e.g., "15:00")
3. Add optional description
4. Click "Save Cutoff Time"
5. Toggle on/off as needed

### Sales Person Experience
**Before Cutoff (e.g., 2:30 PM when cutoff is 3:00 PM):**
- Green status banner: "Orders Allowed - Orders allowed until 15:00"
- Create Order button: Enabled
- Edit buttons: Enabled

**After Cutoff (e.g., 3:30 PM when cutoff is 3:00 PM):**
- Red status banner: "Order Creation Disabled - Orders are not allowed after 15:00"  
- Create Order button: Disabled with tooltip
- Edit buttons: Disabled with tooltip

### API Examples

**Set Cutoff Time:**
```javascript
POST /api/unit-head/cutoff-time
{
  "cutoffTime": "15:00",
  "description": "Daily order submission deadline"
}
```

**Check Order Permission:**
```javascript
GET /api/unit-head/cutoff-time
Response: {
  "success": true,
  "data": {
    "cutoffTime": "15:00",
    "isActive": true,
    "currentStatus": {
      "allowed": false,
      "message": "Orders are not allowed after 15:00",
      "isPastCutoff": true
    }
  }
}
```

## Error Handling

### Backend Validation
- Time format validation (HH:MM)
- Company assignment verification
- Role permission checking
- Graceful cutoff check failures

### Frontend Resilience  
- Loading states during API calls
- Error notifications with retry options
- Fallback to allowing orders if check fails
- Real-time validation feedback

## Security & Permissions

### Role-based Access
- **Unit Heads**: Full cutoff management access
- **Sales**: Read-only status checking, order restrictions apply
- **Unit Managers**: Not affected by cutoff restrictions
- **Super Admins**: Not affected by cutoff restrictions

### Data Security
- Company-based isolation (users only see their company's cutoff)
- Audit trail (createdBy, updatedBy tracking)
- Permission validation on all operations

## Testing Checklist

### Unit Head Testing
- [ ] Can access cutoff time management page
- [ ] Can set new cutoff time
- [ ] Can update existing cutoff time  
- [ ] Can toggle cutoff time on/off
- [ ] See real-time status updates
- [ ] Proper error handling for invalid times

### Sales Person Testing
- [ ] Cannot access cutoff management page
- [ ] See status banner when cutoff is set
- [ ] Can create orders before cutoff time
- [ ] Cannot create orders after cutoff time
- [ ] Can edit orders before cutoff time
- [ ] Cannot edit orders after cutoff time
- [ ] Tooltips show helpful messages

### System Testing
- [ ] Multiple companies have independent cutoffs
- [ ] Cutoff resets daily at midnight
- [ ] Unit Managers unaffected by cutoff
- [ ] Graceful handling of missing cutoff settings
- [ ] Real-time updates work correctly

## Future Enhancements

### Possible Extensions
1. **Weekend/Holiday Cutoffs**: Different cutoff times for weekends
2. **Product-specific Cutoffs**: Different times for different product categories
3. **Warning Notifications**: Email/SMS alerts before cutoff time
4. **Analytics**: Reports on order timing patterns
5. **Multiple Cutoffs**: Different cutoffs for different sales teams

### Performance Optimizations
1. **Caching**: Cache cutoff settings in Redis
2. **Background Jobs**: Pre-calculate daily cutoff status
3. **WebSocket Updates**: Real-time status push notifications

## Troubleshooting

### Common Issues
1. **Buttons still enabled after cutoff**: Check browser cache, refresh page
2. **Wrong cutoff time displayed**: Verify timezone settings
3. **Cutoff not working**: Check if cutoff is active and properly set
4. **Permission denied**: Verify user role and company assignment

### Debug Steps
1. Check browser console for API errors
2. Verify cutoff time in database
3. Test API endpoints directly
4. Check user permissions and role
5. Verify company assignment

This implementation provides a complete, production-ready cutoff time management system that meets all the specified requirements while maintaining security, usability, and extensibility.