const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Warehouse = require('../models/Warehouse.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private (Admin, Viewer)
router.get('/', authorize('admin', 'viewer'), paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { type, status, search } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Warehouse.countDocuments(query);
    const warehouses = await Warehouse.find(query)
        .sort({ name: 1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            warehouses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private (Admin, Viewer)
router.get('/:id', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
        return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { warehouse }
    });
}));

// @desc    Create warehouse
// @route   POST /api/warehouses
// @access  Private (Admin)
router.post('/', [
    authorize('admin'),
    body('name').trim().notEmpty().withMessage('Warehouse name is required'),
    body('capacity.total').isNumeric().withMessage('Total capacity is required'),
    validate
], asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: { warehouse }
    });
}));

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Admin)
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
        return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
        });
    }

    warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'Warehouse updated successfully',
        data: { warehouse }
    });
}));

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
        return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
        });
    }

    // Soft delete - mark as inactive
    warehouse.status = 'closed';
    warehouse.isActive = false;
    await warehouse.save();

    res.status(200).json({
        success: true,
        message: 'Warehouse deactivated successfully'
    });
}));

// @desc    Get warehouse utilization stats
// @route   GET /api/warehouses/:id/utilization
// @access  Private (Admin, Viewer)
router.get('/:id/utilization', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
        return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            warehouseId: warehouse._id,
            name: warehouse.name,
            totalCapacity: warehouse.capacity.total,
            usedCapacity: warehouse.capacity.used,
            availableCapacity: warehouse.availableCapacity,
            utilizationPercentage: warehouse.utilizationPercentage,
            zones: warehouse.zones
        }
    });
}));

// @desc    Get all warehouses statistics
// @route   GET /api/warehouses/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const warehouses = await Warehouse.find({ isActive: true });

    const totalWarehouses = warehouses.length;
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity.total, 0);
    const totalUsed = warehouses.reduce((sum, w) => sum + w.capacity.used, 0);
    const avgUtilization = totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(2) : 0;

    const typeBreakdown = await Warehouse.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const statusBreakdown = await Warehouse.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalWarehouses,
            totalCapacity,
            totalUsed,
            avgUtilization,
            typeBreakdown,
            statusBreakdown
        }
    });
}));

module.exports = router;
