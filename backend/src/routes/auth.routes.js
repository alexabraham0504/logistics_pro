const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User.model');
const { validate, asyncHandler } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['customer', 'viewer', 'admin']).withMessage('Invalid role'),
    validate
], asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, phone, company, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
    }

    // Create user (default role is 'customer')
    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role: role || 'customer',
        phone,
        company,
        address
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                fullName: user.fullName
            },
            token
        }
    });
}));

const fs = require('fs');
const path = require('path');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], asyncHandler(async (req, res) => {
    let { email, password } = req.body;

    // Normalize inputs
    email = email.toLowerCase().trim();
    // Temporary debug: trim password too, and LOG IT to see if there's a mismatch
    const rawPassword = password;
    password = password.trim();

    const logPath = path.join(__dirname, '../../login-debug.log');
    const log = (msg) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

    log(`Attempting login for: '${email}'`);
    log(`Received Password: '${rawPassword}' (Length: ${rawPassword.length})`);
    log(`Trimmed Password: '${password}' (Length: ${password.length})`);

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        log(`User not found: '${email}'`);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    log(`User found: ${user._id} (Role: ${user.role})`);

    // Check if user is active
    if (!user.isActive) {
        log(`User inactive: ${user._id}`);
        return res.status(401).json({
            success: false,
            message: 'Account is deactivated. Please contact support.'
        });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        log(`Password mismatch for user: ${user._id}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    log(`Login successful for: ${user._id}`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                company: user.company,
                lastLogin: user.lastLogin
            },
            token
        }
    });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                phone: user.phone,
                company: user.company,
                address: user.address,
                avatar: user.avatar,
                notificationPreferences: user.notificationPreferences,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        }
    });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', [
    protect,
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    validate
], asyncHandler(async (req, res) => {
    const fieldsToUpdate = {};
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'address', 'notificationPreferences'];

    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            fieldsToUpdate[field] = req.body[field];
        }
    });

    // Check if email is being changed and if it already exists
    if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
        const existingUser = await User.findOne({ email: fieldsToUpdate.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        fieldsToUpdate,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
    });
}));

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', [
    protect,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
], asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: { token }
    });
}));

// @desc    Logout user (optional - mainly for frontend state management)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
}));

module.exports = router;
