const express = require('express');
const router = express.Router();
const Order = require('../models/Order.model');
const Shipment = require('../models/Shipment.model');
const Invoice = require('../models/Invoice.model');
const Vehicle = require('../models/Vehicle.model');
const Driver = require('../models/Driver.model');
const Warehouse = require('../models/Warehouse.model');
const Inventory = require('../models/Inventory.model');
const User = require('../models/User.model');
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/validation.middleware');

router.use(protect);

// Customer Dashboard
router.get('/customer', asyncHandler(async (req, res) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const myOrders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).limit(10).populate('shipment', 'trackingNumber status');
    const orderStats = await Order.aggregate([{ $match: { customer: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const myInvoices = await Invoice.find({ customer: req.user._id }).sort({ createdAt: -1 }).limit(5);
    const pendingPayments = await Invoice.aggregate([{ $match: { customer: req.user._id, status: { $in: ['pending', 'sent', 'partial'] } } }, { $group: { _id: null, total: { $sum: '$amountDue' } } }]);

    const orderIds = myOrders.map(o => o._id);
    const activeShipments = await Shipment.find({ order: { $in: orderIds }, status: { $nin: ['delivered', 'cancelled'] } });

    res.json({
        success: true,
        data: {
            recentOrders: myOrders,
            orderStats: orderStats.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
            recentInvoices: myInvoices,
            pendingPayments: pendingPayments[0]?.total || 0,
            activeShipments: activeShipments.length,
            totalOrders: await Order.countDocuments({ customer: req.user._id })
        }
    });
}));

// Viewer Dashboard (Read-only comprehensive view)
router.get('/viewer', asyncHandler(async (req, res) => {
    if (!['viewer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Orders overview
    const orderStats = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).populate('customer', 'firstName lastName');

    // Shipments overview
    const shipmentStats = await Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    // Revenue overview
    const totalRevenue = await Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);

    // Fleet overview
    const fleetStats = await Vehicle.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

    // Warehouse utilization
    const warehouses = await Warehouse.find({ isActive: true }).select('name capacity');
    const avgUtilization = warehouses.length > 0 ? (warehouses.reduce((sum, w) => sum + ((w.capacity.used / w.capacity.total) * 100), 0) / warehouses.length).toFixed(2) : 0;

    // KPIs
    const deliveredShipments = await Shipment.find({ status: 'delivered' });
    const onTime = deliveredShipments.filter(s => s.actualDelivery && s.estimatedDelivery && s.actualDelivery <= s.estimatedDelivery).length;
    const otifRate = deliveredShipments.length > 0 ? ((onTime / deliveredShipments.length) * 100).toFixed(2) : 100;

    res.json({
        success: true,
        data: {
            orders: { stats: orderStats, recent: recentOrders, total: await Order.countDocuments() },
            shipments: { stats: shipmentStats, inTransit: await Shipment.countDocuments({ status: 'in_transit' }) },
            revenue: { total: totalRevenue[0]?.total || 0, pending: (await Invoice.aggregate([{ $match: { status: { $in: ['pending', 'sent'] } } }, { $group: { _id: null, total: { $sum: '$amountDue' } } }]))[0]?.total || 0 },
            fleet: { stats: fleetStats, total: await Vehicle.countDocuments({ isActive: true }) },
            warehouse: { avgUtilization: parseFloat(avgUtilization), count: warehouses.length },
            kpis: { otifRate: parseFloat(otifRate), totalDeliveries: deliveredShipments.length }
        }
    });
}));

// Admin Dashboard (Full access with quick actions)
router.get('/admin', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's metrics
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todayRevenue = await Invoice.aggregate([{ $match: { status: 'paid', paidAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);

    // Pending items requiring action
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const pendingApprovals = await Order.find({ status: 'pending' }).limit(5).populate('customer', 'firstName lastName');
    const overdueInvoices = await Invoice.countDocuments({ status: { $in: ['pending', 'sent'] }, dueDate: { $lt: new Date() } });
    const lowStockItems = await Inventory.countDocuments({ isActive: true, $expr: { $lte: ['$quantity.available', '$reorderPoint'] } });

    // Fleet alerts
    const vehiclesNeedingService = await Vehicle.countDocuments({ isActive: true, 'maintenanceSchedule.nextService': { $lte: new Date() } });
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiringLicenses = await Driver.countDocuments({ isActive: true, 'license.expiryDate': { $lte: thirtyDays } });

    // Overall stats
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);

    // Recent activity
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName');
    const activeShipments = await Shipment.find({ status: 'in_transit' }).limit(5);

    res.json({
        success: true,
        data: {
            today: { orders: todayOrders, revenue: todayRevenue[0]?.total || 0 },
            alerts: { pendingOrders, overdueInvoices, lowStockItems, vehiclesNeedingService, expiringLicenses },
            pendingApprovals,
            overall: { totalUsers, totalOrders, totalRevenue: totalRevenue[0]?.total || 0 },
            recent: { orders: recentOrders, shipments: activeShipments }
        }
    });
}));

module.exports = router;
