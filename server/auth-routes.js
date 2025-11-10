import express from 'express';
import User from './models/User.js';
import { generateToken, authenticateToken } from './middleware/auth.js';

import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  updateUserPassword 
} from './controllers/userController.js';
import {
  getSettings,
  updateCompanySettings,
  updateSystemSettings,
  updateEmailSettings,
  updateModuleSettings,
  updateNotificationSettings,
  uploadCompanyLogo,
  upload
} from './controllers/settingsController.js';
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from './controllers/brandController.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByBrand
} from './controllers/productController.js';
import bcrypt from 'bcryptjs';
import { profileUpload } from './middleware/upload.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  res.json({ message: 'API working', success: true, timestamp: new Date().toISOString() });
});

// Login route
router.post('/auth/login', async (req, res) => {
  try {
    console.log('=== LOGIN ROUTE HIT ===');
    console.log('Request body:', req.body);
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.log('Looking for user with username:', username);
    
    // Check all users first
    const allUsers = await User.find({}, 'username email role');
    console.log('All users in database:', allUsers);
    
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username }
      ]
    });

    console.log('Found user:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        passwordHash: user.password.substring(0, 20) + '...'
      });
    }

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing password with hash...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      unit: user.unit,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    };

    const response = {
      message: 'Login successful',
      success: true,
      user: userResponse,
      token
    };
    
    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', userResponse.username, 'Role:', userResponse.role);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('=== AUTH/ME ROUTE HIT ===');
    
    const userId = req.user.userId || req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePicture: user.profilePicture ? `/uploads/profiles/${user.profilePicture}` : null,
      role: user.role,
      permissions: user.permissions,
      unit: user.unit,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/auth/logout', (req, res) => {
  // Client handles token removal from localStorage
  res.json({ message: 'Logged out successfully', success: true });
});

// Change password
router.post('/auth/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('=== CHANGE PASSWORD ROUTE HIT ===');
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.userId, { password: hashedPassword });

    res.json({ message: 'Password changed successfully', success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to verify token
const verifyToken = authenticateToken;

// Profile routes are now handled by dedicated profile routes

// User Management Routes (Super User Only) - These come AFTER profile routes
router.get('/users', verifyToken, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.post('/users', verifyToken, createUser);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);
router.post('/users/:id/reset-password', verifyToken, resetUserPassword);
router.put('/users/:id/password', verifyToken, updateUserPassword);

// Settings Routes (Super User Only)
router.get('/settings', verifyToken, getSettings);
router.put('/settings/company', verifyToken, updateCompanySettings);
router.put('/settings/system', verifyToken, updateSystemSettings);
router.put('/settings/email', verifyToken, updateEmailSettings);
router.put('/settings/modules', verifyToken, updateModuleSettings);
router.put('/settings/notifications', verifyToken, updateNotificationSettings);
router.post('/settings/company/logo', verifyToken, upload.single('logo'), uploadCompanyLogo);

// Brand routes
router.get('/brands', verifyToken, getBrands);
router.post('/brands', verifyToken, createBrand);
router.put('/brands/:id', verifyToken, updateBrand);
router.delete('/brands/:id', verifyToken, deleteBrand);

// Product routes
router.get('/products', verifyToken, getProducts);
router.get('/products/:id', verifyToken, getProductById);
router.post('/products', verifyToken, createProduct);
router.put('/products/:id', verifyToken, updateProduct);
router.delete('/products/:id', verifyToken, deleteProduct);
router.get('/brands/:brandId/products', verifyToken, getProductsByBrand);

export default router;