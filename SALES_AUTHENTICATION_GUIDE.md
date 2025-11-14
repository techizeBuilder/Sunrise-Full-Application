# Sales Authentication & Role-Based Filtering Implementation

## Overview
The sales endpoints now implement proper authentication and role-based data filtering, ensuring each salesperson only sees their own data when logged in.

## Implementation Details

### Authentication Setup
- All sales routes are protected with `authenticateToken` middleware
- Role-based authorization with `authorizeRoles('Sales', 'Unit Manager', 'Super Admin')`
- User information is extracted from JWT token and available in `req.user`

### Sales Endpoints & Filtering Rules

#### 1. GET `/api/sales/orders`
**Purpose:** Get orders for the authenticated user
**Filtering Logic:**
- **Sales role:** Only sees orders where `salesPerson` field matches their user ID
- **Unit Manager/Super Admin:** Can see all orders
- **Other roles:** Only see their own orders

#### 2. GET `/api/sales/my-customers` 
**Purpose:** Get customers assigned to the authenticated user
**Filtering Logic:**
- **Sales role:** Only sees customers where `salesContact` matches their username or ID
- **Unit Manager/Super Admin:** Can see all customers
- **Other roles:** Only see their assigned customers

#### 3. GET `/api/sales/my-deliveries`
**Purpose:** Get delivery orders for the authenticated user
**Filtering Logic:**
- **Sales role:** Only sees deliveries for orders they created
- **Unit Manager/Super Admin:** Can see all deliveries
- **Delivery Status Filter:** Only shows orders with status: 'Shipped', 'Out for Delivery', 'Delivered'

#### 4. GET `/api/sales/my-invoices`
**Purpose:** Get invoices related to the authenticated user's orders
**Filtering Logic:**
- **Sales role:** Only sees invoices for orders they created
- **Unit Manager/Super Admin:** Can see all invoices
- **Process:** First finds orders by salesperson, then finds related invoices

#### 5. GET `/api/sales/refund-return`
**Purpose:** Get refund/returns for the authenticated user's orders
**Filtering Logic:**
- **Sales role:** Only sees returns for orders they created
- **Unit Manager/Super Admin:** Can see all returns
- **Process:** First finds orders by salesperson, then finds related returns

## Authentication Flow

### 1. Login Process
```javascript
POST /api/auth/login
Body: {
  "username": "salesuser",
  "password": "password123"
}

Response: {
  "success": true,
  "message": "Login successful", 
  "user": {
    "id": "user_id",
    "username": "salesuser",
    "role": "Sales"
  },
  "token": "JWT_TOKEN_HERE"
}
```

### 2. Using Sales Endpoints
```javascript
// Include JWT token in Authorization header
Authorization: Bearer JWT_TOKEN_HERE

// Example API calls:
GET /api/sales/orders
GET /api/sales/my-customers  
GET /api/sales/my-deliveries
GET /api/sales/my-invoices
GET /api/sales/refund-return
```

## Data Models & Relationships

### Order Model
```javascript
{
  orderCode: String,
  customer: ObjectId (ref: Customer),
  salesPerson: ObjectId (ref: User), // KEY FIELD for filtering
  orderDate: Date,
  products: [OrderProduct],
  totalAmount: Number,
  status: String,
  // ... other fields
}
```

### Customer Model  
```javascript
{
  name: String,
  salesContact: String, // Can be username or user ID
  // ... other fields
}
```

## Security Features

### 1. JWT Authentication
- All requests require valid JWT token
- Token contains user ID and role information
- Tokens expire after 24 hours

### 2. Role-Based Access Control
```javascript
// Middleware chain
salesRouter.use(authenticateToken);
salesRouter.use(authorizeRoles('Sales', 'Unit Manager', 'Super Admin'));
```

### 3. Data Isolation
- Sales users can only access their own data
- Managers can access all data
- Prevents unauthorized data access

## Usage Examples

### For Sales Personnel
When a sales person with username "john_sales" logs in:
1. They receive a JWT token containing their user ID
2. When they call `/api/sales/orders`, they only see orders where `salesPerson` field matches their ID
3. When they call `/api/sales/my-customers`, they only see customers where `salesContact` is "john_sales" or their user ID

### For Managers
When a Unit Manager or Super Admin logs in:
1. They receive a JWT token with elevated privileges
2. When they call any sales endpoint, they see ALL data (not filtered)
3. This allows managers to monitor all sales activities

## Testing

### Test Authentication
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test sales endpoints
curl -X GET http://localhost:5000/api/sales/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Verification Steps
1. ✅ Login works and returns JWT token
2. ✅ All sales endpoints require authentication
3. ✅ Sales users only see their own data
4. ✅ Managers can see all data
5. ✅ Proper error handling for unauthorized access

## Success Confirmation

All sales endpoints are working correctly with proper authentication and role-based filtering:

- `/api/sales/orders` - ✅ Working
- `/api/sales/my-customers` - ✅ Working  
- `/api/sales/my-deliveries` - ✅ Working
- `/api/sales/my-invoices` - ✅ Working
- `/api/sales/refund-return` - ✅ Working

Each salesperson will now only see their own data when they log in and access these endpoints. The system properly authenticates users and filters data based on their role and assignments.