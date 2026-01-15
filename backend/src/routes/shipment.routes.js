const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Shipment = require('../models/Shipment.model');
const Order = require('../models/Order.model');
const { protect, authorize, customerRestrictions } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private (All - filtered by role)
router.get('/', paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { status, search, carrierId, startDate, endDate } = req.query;

    // Build query based on role
    let query = {};

    // Customers can only see their own shipments
    if (req.user.role === 'customer') {
        const customerOrders = await Order.find({ customer: req.user._id }).select('_id');
        query.order = { $in: customerOrders.map(o => o._id) };
    }

    // Apply filters
    if (status) query.status = status;
    if (carrierId) query['carrier.code'] = carrierId;
    if (search) {
        query.$or = [
            { trackingNumber: { $regex: search, $options: 'i' } },
            { 'destination.city': { $regex: search, $options: 'i' } }
        ];
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
        .populate('order', 'orderNumber customer')
        .populate('vehicle', 'vehicleNumber type')
        .populate('driver', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            shipments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Track shipment by tracking number (Public-like access after login)
// @route   GET /api/shipments/track/:trackingNumber
// @access  Private (All)
router.get('/track/:trackingNumber', asyncHandler(async (req, res) => {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber })
        .populate('order', 'orderNumber')
        .populate('driver', 'firstName lastName phone');

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    // For customers, verify they own this shipment
    if (req.user.role === 'customer') {
        const order = await Order.findById(shipment.order);
        if (!order || order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to track this shipment'
            });
        }
    }

    res.status(200).json({
        success: true,
        data: {
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            currentLocation: shipment.currentLocation,
            estimatedDelivery: shipment.estimatedDelivery,
            origin: shipment.origin,
            destination: shipment.destination,
            trackingHistory: shipment.trackingHistory,
            carrier: shipment.carrier,
            delayInfo: shipment.delayInfo
        }
    });
}));

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Private (All - with ownership check for customers)
router.get('/:id', asyncHandler(async (req, res) => {
    const shipment = await Shipment.findById(req.params.id)
        .populate('order')
        .populate('vehicle')
        .populate('driver')
        .populate('trackingHistory.updatedBy', 'firstName lastName');

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    // Check ownership for customers
    if (req.user.role === 'customer') {
        const order = await Order.findById(shipment.order);
        if (!order || order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this shipment'
            });
        }
    }

    res.status(200).json({
        success: true,
        data: { shipment }
    });
}));

// @desc    Create shipment
// @route   POST /api/shipments
// @access  Private (Admin)
router.post('/', [
    authorize('admin'),
    body('order').notEmpty().withMessage('Order is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    validate
], asyncHandler(async (req, res) => {
    const { order: orderId, ...shipmentData } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    // Create shipment
    const shipment = await Shipment.create({
        ...shipmentData,
        order: orderId,
        trackingHistory: [{
            status: 'pending',
            description: 'Shipment created',
            updatedBy: req.user._id
        }]
    });

    // Update order with shipment reference
    order.shipment = shipment._id;
    order.status = 'processing';
    order.statusHistory.push({
        status: 'processing',
        updatedBy: req.user._id,
        notes: `Shipment created with tracking number: ${shipment.trackingNumber}`
    });
    await order.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('shipmentCreated', { shipmentId: shipment._id, trackingNumber: shipment.trackingNumber });

    res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: { shipment }
    });
}));

// @desc    Update shipment
// @route   PUT /api/shipments/:id
// @access  Private (Admin)
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    // Update shipment
    Object.assign(shipment, req.body);
    await shipment.save();

    res.status(200).json({
        success: true,
        message: 'Shipment updated successfully',
        data: { shipment }
    });
}));

// @desc    Update shipment status/location
// @route   PUT /api/shipments/:id/tracking
// @access  Private (Admin)
router.put('/:id/tracking', authorize('admin'), asyncHandler(async (req, res) => {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    const { status, location, description } = req.body;

    // Add tracking event
    const trackingEvent = {
        status: status || shipment.status,
        location,
        description,
        updatedBy: req.user._id,
        timestamp: new Date()
    };

    shipment.trackingHistory.push(trackingEvent);

    if (status) {
        shipment.status = status;
    }

    if (location) {
        shipment.currentLocation = {
            ...location,
            lastUpdated: new Date()
        };
    }

    // Update actual delivery date if delivered
    if (status === 'delivered') {
        shipment.actualDelivery = new Date();

        // Update order status
        const order = await Order.findById(shipment.order);
        if (order) {
            order.status = 'delivered';
            order.actualDeliveryDate = new Date();
            order.slaCompliance = order.checkSlaCompliance();
            order.statusHistory.push({
                status: 'delivered',
                updatedBy: req.user._id,
                notes: 'Shipment delivered'
            });
            await order.save();
        }
    }

    await shipment.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`shipment_${shipment._id}`).emit('trackingUpdate', {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        currentLocation: shipment.currentLocation,
        lastUpdate: trackingEvent
    });

    res.status(200).json({
        success: true,
        message: 'Tracking updated successfully',
        data: { shipment }
    });
}));

// @desc    Report delay
// @route   PUT /api/shipments/:id/delay
// @access  Private (Admin)
router.put('/:id/delay', authorize('admin'), asyncHandler(async (req, res) => {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    const { reason, estimatedNewDelivery } = req.body;

    shipment.delayInfo = {
        isDelayed: true,
        reason,
        estimatedNewDelivery: new Date(estimatedNewDelivery),
        notificationSent: false
    };

    shipment.trackingHistory.push({
        status: shipment.status,
        description: `Delay reported: ${reason}`,
        updatedBy: req.user._id
    });

    await shipment.save();

    // Emit delay notification
    const io = req.app.get('io');
    io.to(`shipment_${shipment._id}`).emit('delayAlert', {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        delayInfo: shipment.delayInfo
    });

    res.status(200).json({
        success: true,
        message: 'Delay reported successfully',
        data: { shipment }
    });
}));

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    // Remove shipment reference from order
    await Order.findByIdAndUpdate(shipment.order, { $unset: { shipment: 1 } });

    await shipment.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Shipment deleted successfully'
    });
}));

// @desc    Get shipment statistics
// @route   GET /api/shipments/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const statusStats = await Shipment.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalShipments = await Shipment.countDocuments();
    const inTransit = await Shipment.countDocuments({ status: 'in_transit' });
    const delivered = await Shipment.countDocuments({ status: 'delivered' });
    const delayed = await Shipment.countDocuments({ 'delayInfo.isDelayed': true });

    // Calculate On-Time In-Full (OTIF) rate
    const deliveredShipments = await Shipment.find({ status: 'delivered' });
    const onTimeDeliveries = deliveredShipments.filter(s =>
        s.actualDelivery && s.estimatedDelivery && s.actualDelivery <= s.estimatedDelivery
    ).length;
    const otifRate = deliveredShipments.length > 0
        ? ((onTimeDeliveries / deliveredShipments.length) * 100).toFixed(2)
        : 100;

    res.status(200).json({
        success: true,
        data: {
            totalShipments,
            inTransit,
            delivered,
            delayed,
            otifRate,
            statusBreakdown: statusStats
        }
    });
}));

module.exports = router;
