const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
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
    amount: {
        type: Number,
        required: true
    },
    taxRate: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    }
});

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'upi', 'net_banking', 'wallet', 'other'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    reference: String,
    notes: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
        default: 'draft'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    billingAddress: {
        name: String,
        company: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    items: [invoiceItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    handlingFee: {
        type: Number,
        default: 0
    },
    insuranceCost: {
        type: Number,
        default: 0
    },
    discount: {
        type: {
            type: String,
            enum: ['percentage', 'fixed']
        },
        value: Number,
        amount: Number
    },
    tax: {
        rate: {
            type: Number,
            default: 0
        },
        amount: {
            type: Number,
            default: 0
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    amountDue: {
        type: Number,
        default: function () {
            return this.totalAmount;
        }
    },
    currency: {
        type: String,
        default: 'INR'
    },
    payments: [paymentSchema],
    paymentTerms: {
        type: String,
        enum: ['due_on_receipt', 'net_15', 'net_30', 'net_45', 'net_60'],
        default: 'net_30'
    },
    notes: String,
    terms: String,
    sentAt: Date,
    paidAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Invoice').countDocuments() + 1;
        this.invoiceNumber = `INV-${year}${month}-${count.toString().padStart(5, '0')}`;
    }

    // Calculate amount due
    this.amountDue = this.totalAmount - this.amountPaid;

    // Update status based on payment
    if (this.amountPaid >= this.totalAmount) {
        this.status = 'paid';
        if (!this.paidAt) this.paidAt = new Date();
    } else if (this.amountPaid > 0) {
        this.status = 'partial';
    } else if (new Date() > this.dueDate && this.status !== 'paid') {
        this.status = 'overdue';
    }

    next();
});

// Add payment method
invoiceSchema.methods.addPayment = function (payment) {
    this.payments.push(payment);
    this.amountPaid += payment.amount;
    this.amountDue = this.totalAmount - this.amountPaid;

    if (this.amountPaid >= this.totalAmount) {
        this.status = 'paid';
        this.paidAt = new Date();
    } else if (this.amountPaid > 0) {
        this.status = 'partial';
    }

    return this.save();
};

// Calculate cost per shipment
invoiceSchema.virtual('costPerShipment').get(function () {
    return this.totalAmount;
});

// Indexes

invoiceSchema.index({ customer: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
