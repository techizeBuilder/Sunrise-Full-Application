# Environment Configuration Guide

This project now supports automatic environment-based configuration for seamless switching between development and production environments.

## Environment Setup

### Development Environment
- **Database**: `mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp`
- **Frontend URL**: `http://localhost:5000`
- **Backend URL**: `http://localhost:5000`

### Production Environment  
- **Database**: `mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp`
- **Frontend URL**: `https://sunrize.shrawantravels.com`
- **Backend URL**: `https://sunrize.shrawantravels.com`

## How to Use

### For Development (Local)
```bash
# Install dependencies
npm install

# Start development server (uses .env file)
npm run dev
```

### For Production
```bash
# Build for production (uses .env.production file)
npm run build

# Start production server (uses .env.production file)  
npm start
```

## Environment Files

### `.env` (Development)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
VITE_API_BASE_URL=http://localhost:5000
VITE_NODE_ENV=development
```

### `.env.production` (Production)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345-PROD
VITE_API_BASE_URL=https://sunrize.shrawantravels.com
VITE_NODE_ENV=production
```

## Automatic Configuration

The system automatically handles:

1. **Database Connection**: Switches between development (`manuerp`) and production (`manufacturing-erp`) databases
2. **API URLs**: Frontend automatically uses correct backend URL based on environment
3. **CORS Origins**: Backend allows appropriate origins based on environment
4. **Port Configuration**: Uses environment-specific port settings

## Key Features

- ✅ **No Manual URL Changes**: Environment automatically detected
- ✅ **Separate Databases**: Development and production use different databases
- ✅ **Automatic CORS**: Correct origins allowed based on environment
- ✅ **Environment Logging**: Clear indication of which environment is running
- ✅ **Fallback Configuration**: Safe defaults if environment variables are missing

## Verification

When you start the server, you should see logs like:
```
MongoDB connected successfully to: manufacturing-erp (production environment)
Server running on port 5000 in production environment
```

And in the frontend console:
```
API Service initialized with base URL: https://sunrize.shrawantravels.com/api (production mode)
```

## Troubleshooting

If you encounter issues:

1. Check that the correct `.env` file is being loaded
2. Verify environment variables are set correctly  
3. Check browser console for API URL logging
4. Ensure MongoDB connection strings are correct for each environment