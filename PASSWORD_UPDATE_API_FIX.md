# Password Update API Fix - Critical Issue Resolved

## 🚨 **Problem Identified**

The password update API (`/api/unit-head/unit-users/{userId}/password`) was storing passwords incorrectly due to a **fundamental mongoose middleware issue**.

### **Root Cause:**
- Using `User.findByIdAndUpdate()` **bypasses** mongoose pre-save middleware
- User model's password hashing middleware only triggers on `.save()`, not on `findByIdAndUpdate()`
- Result: Passwords were stored as **plain text** instead of being properly hashed

### **Code Issue:**
```javascript
❌ WRONG - Bypasses pre-save middleware:
await User.findByIdAndUpdate(userId, {
  password: newPassword  // Stored as plain text!
});

✅ CORRECT - Triggers pre-save middleware:
user.password = newPassword;
await user.save();  // Middleware hashes the password
```

## 🔧 **Fix Applied**

### **Fixed Functions in unitHeadUserController.js:**

1. **`updateUnitUserPassword()`** - New multi-role function
2. **`updateUnitManagerPassword()`** - Legacy function

### **Before (Incorrect):**
```javascript
// This bypassed the pre-save middleware!
await User.findByIdAndUpdate(userId, {
  password: newPassword
});
```

### **After (Correct):**
```javascript
// This triggers the pre-save middleware for proper hashing
user.password = newPassword;
await user.save();
```

## 🛡️ **How Password Hashing Should Work**

### **User Model Pre-Save Middleware:**
```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
```

### **Correct Password Update Flow:**
1. **API receives**: Plain text password (`"12345678"`)
2. **Controller sets**: `user.password = newPassword`
3. **Calls**: `await user.save()`
4. **Mongoose middleware**: Automatically detects password modification
5. **Middleware hashes**: Password with bcrypt + salt
6. **Database stores**: Properly hashed password
7. **API returns**: Success message (no password in response)

## 🧪 **Testing the Fix**

### **API Test:**
```bash
PUT http://localhost:5000/api/unit-head/unit-users/691b0eedfcee654bd9e7845d/password
Content-Type: application/json
Authorization: Bearer <unit-head-token>

{
    "newPassword": "12345678"
}
```

### **Expected Behavior:**
- ✅ Password should be hashed before storing
- ✅ User can login with new password
- ✅ Old password should no longer work
- ✅ Password field excluded from API responses

## 📊 **Impact Assessment**

### **Security Impact:**
- **Before**: Passwords stored as plain text (CRITICAL vulnerability)
- **After**: Passwords properly hashed with bcrypt + salt (SECURE)

### **Affected APIs:**
- ✅ `/api/unit-head/unit-users/{id}/password` - Fixed
- ✅ Legacy `/api/unit-head/unit-managers/{id}/password` - Fixed

### **User Impact:**
- Users with previously updated passwords may need to reset them
- All new password updates will be properly secured
- No breaking changes to API interface

## 🔄 **Consistency Across APIs**

### **Now Consistent With:**
- ✅ `resetUserPassword()` in main user API
- ✅ User creation in all APIs (uses `.save()`)
- ✅ All authentication systems

### **Pattern Used:**
```javascript
// Standard pattern for password updates
const user = await User.findById(userId);
user.password = newPassword;
await user.save(); // Triggers hashing middleware
```

## 📋 **Next Steps**

1. **Test password updates** with the API endpoint
2. **Verify password hashing** in database
3. **Confirm login functionality** with new passwords
4. **Consider password reset** for users affected by the bug

## 🎯 **Result**

The password update API now properly hashes passwords using the same secure method as user creation and password resets, eliminating the critical security vulnerability where passwords were stored in plain text.

### **Security Restored:**
- ✅ bcrypt hashing with salt (strength 12)
- ✅ Consistent with User model design
- ✅ Proper middleware execution
- ✅ No plain text password storage