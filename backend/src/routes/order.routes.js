const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Order = require('../models/Order.model');
const { protect, authorize, customerRestrictions } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (All - filtered by role)
router.get('/', paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { status, priority, search, startDate, endDate } = req.query;

    // Build query based on role
    let query = {};

    // Customers can only see their own orders
    if (req.user.role === 'customer') {
        query.customer = req.user._id;
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'destination.name': { $regex: search, $options: 'i' } },
            { 'destination.city': { $regex: search, $options: 'i' } }
        ];
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email company')
        .populate('shipment', 'trackingNumber status')
        .populate('warehouse', 'name code')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (All - with ownership check for customers)
router.get('/:id', asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'firstName lastName email company phone')
        .populate('shipment')
        .populate('invoice')
        .populate('warehouse', 'name code address')
        .populate('approvedBy', 'firstName lastName')
        .populate('notes.createdBy', 'firstName lastName')
        .populate('statusHistory.updatedBy', 'firstName lastName');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Check ownership for customers
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this order'
        });
    }

    res.status(200).json({
        success: true,
        data: { order }
    });
}));

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Admin)
router.post('/', [
    authorize('admin'),
    body('customer').notEmpty().withMessage('Customer is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    body('destination').notEmpty().withMessage('Destination is required'),
    validate
], asyncHandler(async (req, res) => {
    const orderData = {
        ...req.body,
        statusHistory: [{
            status: req.body.status || 'quotation',
            updatedBy: req.user._id,
            notes: 'Order created'
        }]
    };

    const order = await Order.create(orderData);

    const populatedOrder = await Order.findById(order._id)
        .populate('customer', 'firstName lastName email company');

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: populatedOrder }
    });
}));

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Admin)
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Track status changes
    if (req.body.status && req.body.status !== order.status) {
        order.statusHistory.push({
            status: req.body.status,
            updatedBy: req.user._id,
            notes: req.body.statusNotes || `Status changed to ${req.body.status}`
        });
    }

    // Update order
    Object.assign(order, req.body);
    await order.save();

    const updatedOrder = await Order.findById(order._id)
        .populate('customer', 'firstName lastName email company')
        .populate('shipment', 'trackingNumber status');

    res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: { order: updatedOrder }
    });
}));

// @desc    Approve order
// @route   PUT /api/orders/:id/approve
// @access  Private (Admin)
router.put('/:id/approve', authorize('admin'), asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({
            success: false,
            message: 'Only pending orders can be approved'
        });
    }

    order.status = 'approved';
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    order.statusHistory.push({
        status: 'approved',
        updatedBy: req.user._id,
        notes: 'Order approved'
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order approved successfully',
        data: { order }
    });
}));

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Admin)
router.put('/:id/cancel', authorize('admin'), asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
            success: false,
            message: 'Cannot cancel this order'
        });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
        status: 'cancelled',
        updatedBy: req.user._id,
        notes: req.body.reason || 'Order cancelled'
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
    });
}));

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    await order.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Order deleted successfully'
    });
}));

// @desc    Add note to order
// @route   POST /api/orders/:id/notes
// @access  Private (Admin)
router.post('/:id/notes', authorize('admin'), asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    order.notes.push({
        text: req.body.text,
        createdBy: req.user._id
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Note added successfully',
        data: { order }
    });
}));

// @desc    Get order statistics
// @route   GET /api/orders/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const statusStats = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' }
            }
        }
    ]);

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const recentOrders = await Order.find()
        .populate('customer', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5);

    // Calculate SLA compliance
    const slaStats = await Order.aggregate([
        {
            $match: { status: 'delivered' }
        },
        {
            $group: {
                _id: '$slaCompliance',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            statusBreakdown: statusStats,
            slaCompliance: slaStats,
            recentOrders
        }
    });
}));

module.exports = router;
