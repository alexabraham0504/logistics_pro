const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Viewer)
router.get('/', authorize('admin', 'viewer'), paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { role, isActive, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, Viewer)
router.get('/:id', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { user }
    });
}));

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin)
router.post('/', [
    authorize('admin'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['customer', 'viewer', 'admin']).withMessage('Invalid role'),
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

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
        company,
        address
    });

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user }
    });
}));

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
router.put('/:id', [
    authorize('admin'),
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['customer', 'viewer', 'admin']).withMessage('Invalid role'),
    validate
], asyncHandler(async (req, res) => {
    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Don't allow password update through this route
    const { password, ...updateData } = req.body;

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
    }

    user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user }
    });
}));

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete your own account'
        });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
    });
}));

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin)
router.put('/:id/activate', authorize('admin'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: { user }
    });
}));

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            activeUsers,
            recentUsers,
            byRole: stats.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {})
        }
    });
}));

module.exports = router;
