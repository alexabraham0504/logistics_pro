const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Inventory = require('../models/Inventory.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Admin, Viewer)
router.get('/', authorize('admin', 'viewer'), paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { warehouse, category, status, search } = req.query;

    const query = { isActive: true };
    if (warehouse) query.warehouse = warehouse;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { sku: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { barcode: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Inventory.countDocuments(query);
    const items = await Inventory.find(query)
        .populate('warehouse', 'name code')
        .sort({ name: 1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            items,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (Admin, Viewer)
router.get('/:id', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const item = await Inventory.findById(req.params.id)
        .populate('warehouse', 'name code address')
        .populate('movementHistory.performedBy', 'firstName lastName');

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { item }
    });
}));

// @desc    Get inventory by SKU
// @route   GET /api/inventory/sku/:sku
// @access  Private (Admin, Viewer)
router.get('/sku/:sku', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const item = await Inventory.findOne({ sku: req.params.sku.toUpperCase() })
        .populate('warehouse', 'name code');

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { item }
    });
}));

// @desc    Get inventory by barcode
// @route   GET /api/inventory/barcode/:barcode
// @access  Private (Admin, Viewer)
router.get('/barcode/:barcode', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const item = await Inventory.findOne({ barcode: req.params.barcode })
        .populate('warehouse', 'name code');

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { item }
    });
}));

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Admin)
router.post('/', [
    authorize('admin'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('warehouse').notEmpty().withMessage('Warehouse is required'),
    validate
], asyncHandler(async (req, res) => {
    // Check if SKU already exists
    const existingItem = await Inventory.findOne({ sku: req.body.sku.toUpperCase() });
    if (existingItem) {
        return res.status(400).json({
            success: false,
            message: 'Item with this SKU already exists'
        });
    }

    const item = await Inventory.create({
        ...req.body,
        sku: req.body.sku.toUpperCase(),
        movementHistory: [{
            type: 'inbound',
            quantity: req.body.quantity?.onHand || 0,
            toWarehouse: req.body.warehouse,
            reason: 'Initial stock',
            performedBy: req.user._id
        }]
    });

    res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: { item }
    });
}));

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin)
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let item = await Inventory.findById(req.params.id);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully',
        data: { item }
    });
}));

// @desc    Adjust inventory quantity
// @route   PUT /api/inventory/:id/adjust
// @access  Private (Admin)
router.put('/:id/adjust', [
    authorize('admin'),
    body('type').isIn(['inbound', 'outbound', 'adjustment', 'return']).withMessage('Invalid movement type'),
    body('quantity').isNumeric().withMessage('Quantity is required'),
    validate
], asyncHandler(async (req, res) => {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    const { type, quantity, reason, reference, toWarehouse, fromWarehouse } = req.body;

    // Add movement record
    await item.addMovement({
        type,
        quantity: parseInt(quantity),
        reason,
        reference,
        toWarehouse,
        fromWarehouse,
        performedBy: req.user._id
    });

    res.status(200).json({
        success: true,
        message: 'Inventory adjusted successfully',
        data: { item }
    });
}));

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Inventory item not found'
        });
    }

    // Soft delete
    item.isActive = false;
    item.status = 'discontinued';
    await item.save();

    res.status(200).json({
        success: true,
        message: 'Inventory item deactivated successfully'
    });
}));

// @desc    Get low stock items
// @route   GET /api/inventory/alerts/low-stock
// @access  Private (Admin, Viewer)
router.get('/alerts/low-stock', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const lowStockItems = await Inventory.find({
        isActive: true,
        $expr: { $lte: ['$quantity.available', '$reorderPoint'] }
    }).populate('warehouse', 'name code');

    res.status(200).json({
        success: true,
        data: { items: lowStockItems }
    });
}));

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const totalItems = await Inventory.countDocuments({ isActive: true });

    const statusStats = await Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const categoryStats = await Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$quantity.onHand', '$unitCost'] } } } }
    ]);

    const totalValue = await Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity.onHand', '$unitCost'] } } } }
    ]);

    const lowStockCount = await Inventory.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity.available', '$reorderPoint'] }
    });

    const outOfStockCount = await Inventory.countDocuments({
        isActive: true,
        'quantity.available': 0
    });

    res.status(200).json({
        success: true,
        data: {
            totalItems,
            totalValue: totalValue[0]?.total || 0,
            lowStockCount,
            outOfStockCount,
            statusBreakdown: statusStats,
            categoryBreakdown: categoryStats
        }
    });
}));

module.exports = router;
