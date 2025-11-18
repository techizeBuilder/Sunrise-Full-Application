# Sales Person Orders Issue - Diagnosis and Fix Guide

## Problem
Unit Manager at `http://localhost:5000/api/unit-manager/orders` shows orders from only one salesperson (`sales_jeet`) instead of both salespeople (`sales_jeet` and `sales_jeet01`) from the same unit.

## Enhanced Debugging

I've added comprehensive debugging to the unit manager controller and created diagnostic endpoints to identify and fix the issue.

### 1. Enhanced Debugging in Unit Manager Controller

**Added:**
- Detailed user filtering logs
- Case-insensitive role matching 
- Orders grouped by sales person logging
- Enhanced company filtering

**Key improvements:**
- Added `{ role: { $regex: /sales/i } }` for case-insensitive sales role matching
- Enhanced logging to show exactly which users are found and filtered
- Better debugging to track order assignment

### 2. Diagnostic Endpoints

#### A. Debug Endpoint: `/api/unit-manager/debug`
**Purpose:** Get detailed information about users and orders in the unit manager's company
**Usage:**
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
     http://localhost:5000/api/unit-manager/debug
```

#### B. Sales Issue Diagnosis: `/api/sales-diagnostic/diagnose-sales-issue`
**Purpose:** Comprehensive analysis of the specific sales_jeet/sales_jeet01 issue
**Usage:**
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
     http://localhost:5000/api/sales-diagnostic/diagnose-sales-issue
```

#### C. Fix Endpoint: `/api/sales-diagnostic/fix-sales-issue`
**Purpose:** Apply fixes for common issues (Super Admin only)
**Usage:**
```bash
curl -X POST -H "Authorization: Bearer JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "unify-company", "targetCompanyId": "COMPANY_ID"}' \
     http://localhost:5000/api/sales-diagnostic/fix-sales-issue
```

## Common Root Causes and Solutions

### Issue 1: Different Company IDs
**Symptom:** Only one salesperson appears in company user list
**Cause:** `sales_jeet` and `sales_jeet01` have different `companyId` values
**Solution:**
```javascript
// Update both users to same company
db.users.updateMany(
  { username: { $in: ['sales_jeet', 'sales_jeet01'] } },
  { $set: { companyId: ObjectId('TARGET_COMPANY_ID') } }
)
```

### Issue 2: Case-Sensitive Role Mismatch
**Symptom:** User exists but not included in sales person filtering
**Cause:** Role is 'sales' instead of 'Sales' (case sensitive)
**Solution:** Enhanced filter now handles this automatically, but can fix manually:
```javascript
db.users.updateMany(
  { username: { $in: ['sales_jeet', 'sales_jeet01'] } },
  { $set: { role: 'Sales' } }
)
```

### Issue 3: No Orders Assigned
**Symptom:** Users found but no orders appear
**Cause:** Orders created without salesPerson field or wrong salesPerson ID
**Solution:** Use the existing fix endpoint:
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
     http://localhost:5000/api/unit-manager/fix-orders
```

### Issue 4: Unit Manager Company Assignment
**Symptom:** No orders show at all
**Cause:** Unit manager not assigned to same company as sales people
**Solution:** Verify unit manager has correct companyId

## Testing Workflow

### Step 1: Check Current State
```bash
# Login and get JWT token from browser dev tools
TOKEN="your_jwt_token_here"

# Run comprehensive diagnosis
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/sales-diagnostic/diagnose-sales-issue
```

### Step 2: Identify Issues
The diagnosis will show:
- Both users' company assignments
- Role assignments
- Order counts for each user
- What the unit manager filter includes
- Specific recommendations

### Step 3: Apply Fixes (if needed)
If users are in different companies:
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "unify-company", "targetCompanyId": "COMPANY_ID"}' \
     http://localhost:5000/api/sales-diagnostic/fix-sales-issue
```

### Step 4: Verify Fix
```bash
# Check the main orders endpoint
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/unit-manager/orders
```

## Manual Database Verification

### Check Users:
```javascript
db.users.find({ 
  username: { $in: ['sales_jeet', 'sales_jeet01'] }
}).projection({ username: 1, role: 1, companyId: 1, unit: 1 })
```

### Check Orders:
```javascript
// Find user IDs first
const userIds = db.users.find({ 
  username: { $in: ['sales_jeet', 'sales_jeet01'] }
}).map(u => u._id)

// Check orders for these users
db.orders.find({ 
  salesPerson: { $in: userIds }
}).projection({ orderCode: 1, salesPerson: 1, customer: 1, status: 1 })
```

## Expected Result

After fixes, the `/api/unit-manager/orders` endpoint should show:
- Products grouped by salesperson
- Both `sales_jeet` and `sales_jeet01` should appear if they have orders
- Orders should be properly grouped under each salesperson
- Total counts should include orders from both users

The response format groups by products and then shows salespeople for each product:
```json
{
  "success": true,
  "data": [
    {
      "productId": "...",
      "productName": "Product Name",
      "salesPersons": [
        {
          "username": "sales_jeet",
          "totalQuantity": 10,
          "orderCount": 2,
          "orders": [...]
        },
        {
          "username": "sales_jeet01", 
          "totalQuantity": 5,
          "orderCount": 1,
          "orders": [...]
        }
      ]
    }
  ]
}
```