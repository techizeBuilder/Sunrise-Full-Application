# Unit Manager Orders API Test Guide

## Testing the API endpoints

### 1. First, start the server:
```bash
cd server
npm start
```

### 2. Login to get JWT token:
Visit http://localhost:5000 in browser and login with unit manager credentials.
Open browser dev tools > Application > Local Storage and copy the JWT token.

### 3. Test the debug endpoint:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
     http://localhost:5000/api/unit-manager/debug
```

### 4. Test the main orders endpoint:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
     http://localhost:5000/api/unit-manager/orders
```

### 5. Check for issues:

The debug endpoint will show:
- All users in the same company as the unit manager
- All orders assigned to those users
- Orders grouped by sales person

This will help identify:
- Are both sales_jeet and sales_jeet01 in the same company?
- Do both users have the correct role?
- Are there orders assigned to both users?
- Are the orders being filtered correctly?

## Common Issues and Solutions:

### Issue 1: Users not in same company
**Symptoms:** Only one user shows up in company users list
**Solution:** Update user records to have same companyId

### Issue 2: Incorrect role
**Symptoms:** User not appearing in sales persons list
**Solution:** Ensure role is exactly 'Sales' (case sensitive)

### Issue 3: Orders not assigned to sales person
**Symptoms:** Orders show salesPerson as null
**Solution:** Run the fix-orders endpoint or manually assign salesPerson

### Issue 4: Case sensitivity in roles
**Symptoms:** Some users not found despite correct company
**Solution:** The enhanced filter now includes case-insensitive role matching

## Manual Database Fixes:

If users need to be assigned to same company:
```javascript
// In MongoDB compass or shell:
db.users.updateMany(
  { username: { $in: ['sales_jeet', 'sales_jeet01'] } },
  { $set: { companyId: ObjectId('YOUR_COMPANY_ID') } }
)
```

If orders need salesPerson assignment:
```javascript
// Find user IDs first:
const users = db.users.find({ username: { $in: ['sales_jeet', 'sales_jeet01'] } })

// Then update orders:
db.orders.updateMany(
  { salesPerson: { $exists: false } },
  { $set: { salesPerson: ObjectId('USER_ID_HERE') } }
)
```