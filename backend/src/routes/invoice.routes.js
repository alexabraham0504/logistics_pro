const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Invoice = require('../models/Invoice.model');
const Order = require('../models/Order.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, asyncHandler, paginate } = require('../middleware/validation.middleware');

router.use(protect);

// Get all invoices
router.get('/', paginate, asyncHandler(async (req, res) => {
    const { page, limit, startIndex } = req.pagination;
    const { status, search } = req.query;

    let query = {};
    if (req.user.role === 'customer') query.customer = req.user._id;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
        .populate('customer', 'firstName lastName email company')
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    res.json({ success: true, data: { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}));

// Get single invoice
router.get('/:id', asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('customer order shipment')
        .populate('payments.recordedBy', 'firstName lastName');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user.role === 'customer' && invoice.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: { invoice } });
}));

// Create invoice
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
    const { order: orderId, items, shippingCost = 0, handlingFee = 0, insuranceCost = 0, discount, tax } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    let discountAmount = discount?.type === 'percentage' ? (subtotal * discount.value / 100) : (discount?.value || 0);
    const taxAmount = tax?.rate ? ((subtotal - discountAmount) * tax.rate / 100) : 0;
    const totalAmount = subtotal - discountAmount + taxAmount + shippingCost + handlingFee + insuranceCost;

    const invoice = await Invoice.create({ ...req.body, subtotal, totalAmount, amountDue: totalAmount, createdBy: req.user._id });
    order.invoice = invoice._id;
    await order.save();

    res.status(201).json({ success: true, message: 'Invoice created', data: { invoice } });
}));

// Update invoice
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!['draft', 'pending'].includes(invoice.status)) return res.status(400).json({ success: false, message: 'Cannot update' });

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Invoice updated', data: { invoice } });
}));

// Record payment
router.post('/:id/payments', authorize('admin'), asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    await invoice.addPayment({ ...req.body, recordedBy: req.user._id });
    res.json({ success: true, message: 'Payment recorded', data: { invoice } });
}));

// Cancel invoice
router.put('/:id/cancel', authorize('admin'), asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Cannot cancel paid invoice' });

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    invoice.cancelReason = req.body.reason;
    await invoice.save();
    res.json({ success: true, message: 'Invoice cancelled', data: { invoice } });
}));

// Get statistics
router.get('/stats/overview', authorize('admin', 'viewer'), asyncHandler(async (req, res) => {
    const totalInvoices = await Invoice.countDocuments();
    const statusStats = await Invoice.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }]);
    const totalRevenue = await Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const pendingAmount = await Invoice.aggregate([{ $match: { status: { $in: ['pending', 'sent', 'partial'] } } }, { $group: { _id: null, total: { $sum: '$amountDue' } } }]);

    res.json({
        success: true,
        data: { totalInvoices, totalRevenue: totalRevenue[0]?.total || 0, pendingAmount: pendingAmount[0]?.total || 0, statusBreakdown: statusStats }
    });
}));

module.exports = router;
