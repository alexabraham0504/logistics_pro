const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    sku: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    weight: {
        type: Number,
        default: 0
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['quotation', 'pending', 'approved', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned'],
        default: 'quotation'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    origin: {
        name: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        contactPerson: String,
        phone: String
    },
    destination: {
        name: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        contactPerson: String,
        phone: String
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    specialInstructions: String,
    shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    slaDeadline: Date,
    slaCompliance: {
        type: String,
        enum: ['on_track', 'at_risk', 'breached', 'met'],
        default: 'on_track'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    notes: [{
        text: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }]
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Order').countDocuments() + 1;
        this.orderNumber = `ORD-${year}${month}-${count.toString().padStart(5, '0')}`;
    }
    next();
});

// Calculate SLA compliance
orderSchema.methods.checkSlaCompliance = function () {
    if (!this.slaDeadline) return 'on_track';

    const now = new Date();
    const deadline = new Date(this.slaDeadline);

    if (this.status === 'delivered') {
        return this.actualDeliveryDate <= deadline ? 'met' : 'breached';
    }

    const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);

    if (hoursToDeadline < 0) return 'breached';
    if (hoursToDeadline < 24) return 'at_risk';
    return 'on_track';
};

// Index for better query performance
orderSchema.index({ customer: 1, status: 1 });

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
