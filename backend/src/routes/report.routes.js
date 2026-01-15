const express = require('express');
const router = express.Router();
const Order = require('../models/Order.model');
const Shipment = require('../models/Shipment.model');
const Invoice = require('../models/Invoice.model');
const Vehicle = require('../models/Vehicle.model');
const Inventory = require('../models/Inventory.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/validation.middleware');

router.use(protect);
router.use(authorize('admin', 'viewer'));

// KPI Report
router.get('/kpi', asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // OTIF Rate
    const deliveredShipments = await Shipment.find({ status: 'delivered', ...(startDate || endDate ? { actualDelivery: dateFilter } : {}) });
    const onTimeDeliveries = deliveredShipments.filter(s => s.actualDelivery && s.estimatedDelivery && s.actualDelivery <= s.estimatedDelivery).length;
    const otifRate = deliveredShipments.length > 0 ? ((onTimeDeliveries / deliveredShipments.length) * 100).toFixed(2) : 100;

    // Cost per Shipment
    const paidInvoices = await Invoice.find({ status: 'paid' });
    const totalShippingCost = paidInvoices.reduce((sum, inv) => sum + (inv.shippingCost || 0), 0);
    const avgCostPerShipment = paidInvoices.length > 0 ? (totalShippingCost / paidInvoices.length).toFixed(2) : 0;

    // Fleet Utilization
    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const inTransitVehicles = await Vehicle.countDocuments({ isActive: true, status: 'in_transit' });
    const fleetUtilization = totalVehicles > 0 ? ((inTransitVehicles / totalVehicles) * 100).toFixed(2) : 0;

    // Order Fulfillment Rate
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const fulfillmentRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0;

    res.json({
        success: true,
        data: {
            otifRate: parseFloat(otifRate),
            avgCostPerShipment: parseFloat(avgCostPerShipment),
            fleetUtilization: parseFloat(fleetUtilization),
            orderFulfillmentRate: parseFloat(fulfillmentRate),
            totalDeliveries: deliveredShipments.length,
            onTimeDeliveries
        }
    });
}));

// Order Report
router.get('/orders', asyncHandler(async (req, res) => {
    const { startDate, endDate, status, groupBy = 'day' } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    if (status) matchStage.status = status;

    const groupFormat = groupBy === 'month' ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } } : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

    const report = await Order.aggregate([
        { $match: matchStage },
        { $group: { _id: groupFormat, orderCount: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    const statusBreakdown = await Order.aggregate([{ $match: matchStage }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

    res.json({ success: true, data: { report, statusBreakdown } });
}));

// Revenue Report
router.get('/revenue', asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const matchStage = { status: 'paid' };
    if (startDate || endDate) {
        matchStage.paidAt = {};
        if (startDate) matchStage.paidAt.$gte = new Date(startDate);
        if (endDate) matchStage.paidAt.$lte = new Date(endDate);
    }

    const groupFormat = groupBy === 'day' ? { year: { $year: '$paidAt' }, month: { $month: '$paidAt' }, day: { $dayOfMonth: '$paidAt' } } : { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } };

    const report = await Invoice.aggregate([
        { $match: matchStage },
        { $group: { _id: groupFormat, revenue: { $sum: '$totalAmount' }, invoiceCount: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    const totalRevenue = report.reduce((sum, r) => sum + r.revenue, 0);

    res.json({ success: true, data: { report, totalRevenue } });
}));

// Shipment Report
router.get('/shipments', asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const statusBreakdown = await Shipment.aggregate([{ $match: matchStage }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const carrierBreakdown = await Shipment.aggregate([{ $match: matchStage }, { $group: { _id: '$carrier.name', count: { $sum: 1 } } }]);
    const delayedCount = await Shipment.countDocuments({ ...matchStage, 'delayInfo.isDelayed': true });

    res.json({ success: true, data: { statusBreakdown, carrierBreakdown, delayedCount } });
}));

// Inventory Report
router.get('/inventory', asyncHandler(async (req, res) => {
    const statusBreakdown = await Inventory.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const categoryBreakdown = await Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', itemCount: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$quantity.onHand', '$unitCost'] } } } }
    ]);
    const lowStockItems = await Inventory.find({ isActive: true, $expr: { $lte: ['$quantity.available', '$reorderPoint'] } }).select('sku name quantity reorderPoint').limit(20);

    res.json({ success: true, data: { statusBreakdown, categoryBreakdown, lowStockItems } });
}));

// Export report (CSV format)
router.get('/export/:type', asyncHandler(async (req, res) => {
    const { type } = req.params;
    let data = [];
    let filename = '';

    switch (type) {
        case 'orders':
            data = await Order.find().populate('customer', 'firstName lastName email').lean();
            filename = 'orders_report.csv';
            break;
        case 'invoices':
            data = await Invoice.find().populate('customer', 'firstName lastName email').lean();
            filename = 'invoices_report.csv';
            break;
        case 'shipments':
            data = await Shipment.find().lean();
            filename = 'shipments_report.csv';
            break;
        default:
            return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.json({ success: true, data: { records: data, filename, count: data.length } });
}));

module.exports = router;
