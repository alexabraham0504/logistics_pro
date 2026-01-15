const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

// Apply protection to all routes
router.use(protect);

// ==================== VEHICLE ROUTES ====================

// @desc    Get all vehicles
// @route   GET /api/fleet/vehicles
// @access  Private (Admin, Viewer)
router.get('/vehicles', authorize('admin', 'viewer'), paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { type, status, search } = req.query;

    const query = { isActive: true };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { licensePlate: { $regex: search, $options: 'i' } },
            { make: { $regex: search, $options: 'i' } },
            { model: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
        .populate('assignedDriver', 'firstName lastName employeeId')
        .populate('assignedWarehouse', 'name code')
        .sort({ vehicleNumber: 1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            vehicles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single vehicle
// @route   GET /api/fleet/vehicles/:id
// @access  Private (Admin, Viewer)
router.get('/vehicles/:id', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id)
        .populate('assignedDriver')
        .populate('assignedWarehouse');

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { vehicle }
    });
}));

// @desc    Create vehicle
// @route   POST /api/fleet/vehicles
// @access  Private (Admin)
router.post('/vehicles', [
    authorize('admin'),
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('type').isIn(['truck', 'van', 'trailer', 'container', 'pickup', 'flatbed', 'refrigerated']).withMessage('Invalid vehicle type'),
    body('licensePlate').trim().notEmpty().withMessage('License plate is required'),
    validate
], asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle }
    });
}));

// @desc    Update vehicle
// @route   PUT /api/fleet/vehicles/:id
// @access  Private (Admin)
router.put('/vehicles/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle }
    });
}));

// @desc    Update vehicle location (GPS tracking)
// @route   PUT /api/fleet/vehicles/:id/location
// @access  Private (Admin)
router.put('/vehicles/:id/location', authorize('admin'), asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    const { address, coordinates } = req.body;
    vehicle.currentLocation = {
        address,
        coordinates,
        lastUpdated: new Date()
    };

    await vehicle.save();

    // Emit real-time location update
    const io = req.app.get('io');
    io.to(`fleet_${vehicle._id}`).emit('vehicleLocationUpdate', {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        currentLocation: vehicle.currentLocation
    });

    res.status(200).json({
        success: true,
        message: 'Vehicle location updated',
        data: { vehicle }
    });
}));

// @desc    Add maintenance record
// @route   POST /api/fleet/vehicles/:id/maintenance
// @access  Private (Admin)
router.post('/vehicles/:id/maintenance', authorize('admin'), asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    const maintenanceRecord = {
        ...req.body,
        performedBy: req.user._id
    };

    vehicle.maintenanceHistory.push(maintenanceRecord);
    vehicle.maintenanceSchedule.lastService = req.body.date;

    if (req.body.nextServiceDate) {
        vehicle.maintenanceSchedule.nextService = req.body.nextServiceDate;
    }

    // Update costs
    if (req.body.cost) {
        vehicle.costs.maintenance = (vehicle.costs.maintenance || 0) + req.body.cost;
    }

    await vehicle.save();

    res.status(200).json({
        success: true,
        message: 'Maintenance record added',
        data: { vehicle }
    });
}));

// @desc    Add fuel record
// @route   POST /api/fleet/vehicles/:id/fuel
// @access  Private (Admin)
router.post('/vehicles/:id/fuel', authorize('admin'), asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    vehicle.fuelHistory.push(req.body);

    // Update odometer
    if (req.body.odometer) {
        vehicle.odometer.current = req.body.odometer;
    }

    // Update fuel costs
    if (req.body.cost) {
        vehicle.costs.fuel = (vehicle.costs.fuel || 0) + req.body.cost;
    }

    await vehicle.save();

    res.status(200).json({
        success: true,
        message: 'Fuel record added',
        data: { vehicle }
    });
}));

// @desc    Delete vehicle
// @route   DELETE /api/fleet/vehicles/:id
// @access  Private (Admin)
router.delete('/vehicles/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
        });
    }

    vehicle.isActive = false;
    vehicle.status = 'out_of_service';
    await vehicle.save();

    res.status(200).json({
        success: true,
        message: 'Vehicle deactivated successfully'
    });
}));

// ==================== DRIVER ROUTES ====================

// @desc    Get all drivers
// @route   GET /api/fleet/drivers
// @access  Private (Admin, Viewer)
router.get('/drivers', authorize('admin', 'viewer'), paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { status, search } = req.query;

    const query = { isActive: true };
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Driver.countDocuments(query);
    const drivers = await Driver.find(query)
        .populate('assignedVehicle', 'vehicleNumber type')
        .sort({ lastName: 1 })
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        data: {
            drivers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
}));

// @desc    Get single driver
// @route   GET /api/fleet/drivers/:id
// @access  Private (Admin, Viewer)
router.get('/drivers/:id', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id)
        .populate('assignedVehicle')
        .populate('notes.createdBy', 'firstName lastName');

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }

    res.status(200).json({
        success: true,
        data: { driver }
    });
}));

// @desc    Create driver
// @route   POST /api/fleet/drivers
// @access  Private (Admin)
router.post('/drivers', [
    authorize('admin'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('license.number').notEmpty().withMessage('License number is required'),
    body('license.type').notEmpty().withMessage('License type is required'),
    body('license.expiryDate').isISO8601().withMessage('Valid license expiry date is required'),
    validate
], asyncHandler(async (req, res) => {
    const driver = await Driver.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: { driver }
    });
}));

// @desc    Update driver
// @route   PUT /api/fleet/drivers/:id
// @access  Private (Admin)
router.put('/drivers/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let driver = await Driver.findById(req.params.id);

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }

    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'Driver updated successfully',
        data: { driver }
    });
}));

// @desc    Delete driver
// @route   DELETE /api/fleet/drivers/:id
// @access  Private (Admin)
router.delete('/drivers/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }

    driver.isActive = false;
    driver.status = 'inactive';
    await driver.save();

    res.status(200).json({
        success: true,
        message: 'Driver deactivated successfully'
    });
}));

// ==================== FLEET STATISTICS ====================

// @desc    Get fleet statistics
// @route   GET /api/fleet/stats/overview
// @access  Private (Admin, Viewer)
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    // Vehicle stats
    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const vehicleStatusStats = await Vehicle.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const vehicleTypeStats = await Vehicle.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Driver stats
    const totalDrivers = await Driver.countDocuments({ isActive: true });
    const driverStatusStats = await Driver.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Vehicles needing maintenance
    const vehiclesNeedingService = await Vehicle.countDocuments({
        isActive: true,
        'maintenanceSchedule.nextService': { $lte: new Date() }
    });

    // Drivers with expiring licenses (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const driversExpiringLicense = await Driver.countDocuments({
        isActive: true,
        'license.expiryDate': { $lte: thirtyDaysFromNow }
    });

    // Calculate total fuel costs
    const fuelCosts = await Vehicle.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$costs.fuel' } } }
    ]);

    // Calculate total maintenance costs
    const maintenanceCosts = await Vehicle.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$costs.maintenance' } } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            vehicles: {
                total: totalVehicles,
                byStatus: vehicleStatusStats,
                byType: vehicleTypeStats,
                needingService: vehiclesNeedingService
            },
            drivers: {
                total: totalDrivers,
                byStatus: driverStatusStats,
                expiringLicenses: driversExpiringLicense
            },
            costs: {
                totalFuel: fuelCosts[0]?.total || 0,
                totalMaintenance: maintenanceCosts[0]?.total || 0
            }
        }
    });
}));

module.exports = router;
