const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        sparse: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    dateOfBirth: Date,
    hireDate: Date,
    status: {
        type: String,
        enum: ['available', 'on_duty', 'off_duty', 'on_leave', 'inactive'],
        default: 'available'
    },
    license: {
        number: {
            type: String,
            required: [true, 'License number is required']
        },
        type: {
            type: String,
            enum: ['CDL-A', 'CDL-B', 'CDL-C', 'Class A', 'Class B', 'Class C', 'HMV', 'LMV', 'MCWG'],
            required: true
        },
        expiryDate: {
            type: Date,
            required: true
        },
        endorsements: [String],
        restrictions: [String]
    },
    certifications: [{
        name: String,
        issuedDate: Date,
        expiryDate: Date,
        issuingAuthority: String
    }],
    assignedVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    currentLocation: {
        coordinates: {
            lat: Number,
            lng: Number
        },
        lastUpdated: Date
    },
    performance: {
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 5
        },
        totalDeliveries: {
            type: Number,
            default: 0
        },
        onTimeRate: {
            type: Number,
            default: 100
        },
        safetyScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },
        incidentCount: {
            type: Number,
            default: 0
        }
    },
    workSchedule: {
        monday: { start: String, end: String, isWorking: Boolean },
        tuesday: { start: String, end: String, isWorking: Boolean },
        wednesday: { start: String, end: String, isWorking: Boolean },
        thursday: { start: String, end: String, isWorking: Boolean },
        friday: { start: String, end: String, isWorking: Boolean },
        saturday: { start: String, end: String, isWorking: Boolean },
        sunday: { start: String, end: String, isWorking: Boolean }
    },
    hoursLogged: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 }
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    salary: {
        base: Number,
        perMile: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    documents: [{
        type: String,
        name: String,
        url: String,
        uploadDate: Date
    }],
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
    // Blockchain profile for driver identity verification
    blockchainProfile: {
        profileHash: String,           // Hash of driver identity
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'suspended', 'rejected'],
            default: 'pending'
        },
        lastBlockHash: String,
        blockchainRecordCount: {
            type: Number,
            default: 0
        },
        verifiedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: Date
    },
    // Blackbug - Driver behavior monitoring
    behaviorMonitoring: {
        tripCount: {
            type: Number,
            default: 0
        },
        totalDistance: {
            type: Number,
            default: 0
        },
        averageSpeed: {
            type: Number,
            default: 0
        },
        harshBrakingEvents: {
            type: Number,
            default: 0
        },
        harshAccelerationEvents: {
            type: Number,
            default: 0
        },
        idleTimePercentage: {
            type: Number,
            default: 0
        },
        nightDrivingHours: {
            type: Number,
            default: 0
        },
        overspeedingInstances: {
            type: Number,
            default: 0
        },
        lastMonitoringUpdate: Date,
        blockchainHash: String,        // Hash of behavior data
        lastTripHash: String
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

// Virtual for full name
driverSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Check if license is valid
driverSchema.virtual('isLicenseValid').get(function () {
    return this.license.expiryDate > new Date();
});

// Generate employee ID before saving
driverSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        const count = await mongoose.model('Driver').countDocuments() + 1;
        this.employeeId = `DRV-${count.toString().padStart(5, '0')}`;
    }
    next();
});

// Indexes

driverSchema.index({ status: 1 });
driverSchema.index({ 'license.expiryDate': 1 });

module.exports = mongoose.model('Driver', driverSchema);
