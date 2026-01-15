const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['scheduled', 'unscheduled', 'repair', 'inspection', 'oil_change', 'tire_rotation', 'brake_service'],
        required: true
    },
    description: String,
    date: {
        type: Date,
        required: true
    },
    cost: Number,
    odometer: Number,
    vendor: String,
    notes: String,
    nextServiceDate: Date,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const fuelRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        enum: ['liters', 'gallons'],
        default: 'liters'
    },
    cost: Number,
    odometer: Number,
    location: String,
    fuelType: {
        type: String,
        enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'],
        default: 'diesel'
    }
});

const vehicleSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['truck', 'van', 'trailer', 'container', 'pickup', 'flatbed', 'refrigerated'],
        required: true
    },
    make: String,
    model: String,
    year: Number,
    vin: {
        type: String,
        unique: true,
        sparse: true
    },
    licensePlate: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'in_transit', 'maintenance', 'out_of_service', 'reserved'],
        default: 'available'
    },
    capacity: {
        weight: {
            value: Number,
            unit: {
                type: String,
                enum: ['kg', 'tons', 'lbs'],
                default: 'kg'
            }
        },
        volume: {
            value: Number,
            unit: {
                type: String,
                enum: ['cubic_meters', 'cubic_feet'],
                default: 'cubic_meters'
            }
        },
        pallets: Number
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['meters', 'feet'],
            default: 'meters'
        }
    },
    features: {
        hasGPS: { type: Boolean, default: true },
        hasRefrigeration: { type: Boolean, default: false },
        hasTailLift: { type: Boolean, default: false },
        hasTrackingDevice: { type: Boolean, default: true }
    },
    currentLocation: {
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        lastUpdated: Date
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    assignedWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    odometer: {
        current: Number,
        unit: {
            type: String,
            enum: ['km', 'miles'],
            default: 'km'
        }
    },
    fuelType: {
        type: String,
        enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'],
        default: 'diesel'
    },
    fuelEfficiency: {
        value: Number,
        unit: String // km/l or mpg
    },
    insurance: {
        provider: String,
        policyNumber: String,
        expiryDate: Date,
        coverage: String
    },
    registration: {
        number: String,
        expiryDate: Date,
        issuingAuthority: String
    },
    maintenanceSchedule: {
        lastService: Date,
        nextService: Date,
        serviceInterval: Number // in km or days
    },
    maintenanceHistory: [maintenanceRecordSchema],
    fuelHistory: [fuelRecordSchema],
    costs: {
        acquisition: Number,
        monthlyLease: Number,
        insurance: Number,
        maintenance: Number,
        fuel: Number
    },
    documents: [{
        type: String,
        name: String,
        url: String,
        expiryDate: Date
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total operating cost
vehicleSchema.virtual('totalOperatingCost').get(function () {
    const costs = this.costs;
    return (costs.monthlyLease || 0) + (costs.insurance || 0) + (costs.maintenance || 0) + (costs.fuel || 0);
});

// Calculate average fuel consumption
vehicleSchema.methods.getAverageFuelConsumption = function () {
    if (!this.fuelHistory || this.fuelHistory.length < 2) return null;

    const totalFuel = this.fuelHistory.reduce((sum, record) => sum + record.quantity, 0);
    const firstRecord = this.fuelHistory[0];
    const lastRecord = this.fuelHistory[this.fuelHistory.length - 1];
    const distanceTraveled = lastRecord.odometer - firstRecord.odometer;

    if (distanceTraveled <= 0) return null;
    return (distanceTraveled / totalFuel).toFixed(2);
};

// Indexes
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ 'currentLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Vehicle', vehicleSchema);
