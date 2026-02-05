const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Warehouse name is required'],
        trim: true
    },
    code: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['distribution_center', 'fulfillment_center', 'cold_storage', 'cross_dock', 'regional_hub'],
        default: 'distribution_center'
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contact: {
        manager: String,
        phone: String,
        email: String
    },
    capacity: {
        total: {
            type: Number,
            required: true // in cubic meters or pallets
        },
        used: {
            type: Number,
            default: 0
        },
        unit: {
            type: String,
            enum: ['cubic_meters', 'pallets', 'sqft'],
            default: 'pallets'
        }
    },
    zones: [{
        name: String,
        type: {
            type: String,
            enum: ['receiving', 'storage', 'picking', 'packing', 'shipping', 'returns', 'cold', 'hazmat']
        },
        capacity: Number,
        used: Number
    }],
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    features: {
        hasRFID: { type: Boolean, default: false },
        hasBarcode: { type: Boolean, default: true },
        hasClimateControl: { type: Boolean, default: false },
        hasSecurity: { type: Boolean, default: true },
        hasLoadingDocks: { type: Boolean, default: true },
        dockCount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance', 'closed'],
        default: 'active'
    },
    metrics: {
        averageProcessingTime: Number, // in hours
        orderAccuracyRate: Number, // percentage
        utilizationRate: Number // percentage
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for utilization percentage
warehouseSchema.virtual('utilizationPercentage').get(function () {
    if (!this.capacity.total || this.capacity.total === 0) return 0;
    return ((this.capacity.used / this.capacity.total) * 100).toFixed(2);
});

// Virtual for available capacity
warehouseSchema.virtual('availableCapacity').get(function () {
    return this.capacity.total - this.capacity.used;
});

// Generate warehouse code before saving
warehouseSchema.pre('save', async function (next) {
    if (!this.code) {
        const prefix = this.type.substring(0, 2).toUpperCase();
        const count = await mongoose.model('Warehouse').countDocuments() + 1;
        this.code = `WH-${prefix}-${count.toString().padStart(4, '0')}`;
    }
    next();
});

// Index for location-based queries
warehouseSchema.index({ 'address.coordinates': '2dsphere' });


module.exports = mongoose.model('Warehouse', warehouseSchema);
