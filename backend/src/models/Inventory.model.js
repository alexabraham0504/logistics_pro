const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['inbound', 'outbound', 'transfer', 'adjustment', 'return'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    fromWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    toWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    reference: String,
    reason: String,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const inventorySchema = new mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: String,
    category: {
        type: String,
        required: true
    },
    subCategory: String,
    barcode: {
        type: String,
        unique: true,
        sparse: true
    },
    rfidTag: String,
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    zone: String,
    location: {
        aisle: String,
        rack: String,
        shelf: String,
        bin: String
    },
    quantity: {
        onHand: {
            type: Number,
            default: 0,
            min: 0
        },
        reserved: {
            type: Number,
            default: 0,
            min: 0
        },
        available: {
            type: Number,
            default: 0,
            min: 0
        },
        inTransit: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    reorderPoint: {
        type: Number,
        default: 10
    },
    reorderQuantity: {
        type: Number,
        default: 50
    },
    unitCost: {
        type: Number,
        default: 0
    },
    unitPrice: {
        type: Number,
        default: 0
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'lbs', 'g'],
            default: 'kg'
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'in', 'm'],
            default: 'cm'
        }
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'on_order'],
        default: 'in_stock'
    },
    expiryDate: Date,
    batchNumber: String,
    supplier: {
        name: String,
        code: String,
        leadTime: Number // days
    },
    movementHistory: [inventoryMovementSchema],
    lastStockCheck: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total value
inventorySchema.virtual('totalValue').get(function () {
    return this.quantity.onHand * this.unitCost;
});

// Update available quantity
inventorySchema.pre('save', function (next) {
    this.quantity.available = this.quantity.onHand - this.quantity.reserved;

    // Update status based on quantity
    if (this.quantity.available <= 0) {
        this.status = 'out_of_stock';
    } else if (this.quantity.available <= this.reorderPoint) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }

    next();
});

// Add movement record
inventorySchema.methods.addMovement = function (movement) {
    this.movementHistory.push(movement);

    switch (movement.type) {
        case 'inbound':
            this.quantity.onHand += movement.quantity;
            break;
        case 'outbound':
            this.quantity.onHand -= movement.quantity;
            break;
        case 'adjustment':
            this.quantity.onHand += movement.quantity; // can be negative
            break;
        case 'return':
            this.quantity.onHand += movement.quantity;
            break;
    }

    return this.save();
};

// Indexes
inventorySchema.index({ sku: 1, warehouse: 1 });
inventorySchema.index({ barcode: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ category: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
