const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: String,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const shipmentSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        unique: true,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled'],
        default: 'pending'
    },
    carrier: {
        name: String,
        code: String,
        trackingUrl: String
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    origin: {
        name: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    destination: {
        name: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    currentLocation: {
        address: String,
        city: String,
        state: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        lastUpdated: Date
    },
    packageDetails: {
        weight: Number,
        weightUnit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'in'],
                default: 'cm'
            }
        },
        packageCount: {
            type: Number,
            default: 1
        },
        description: String,
        isFragile: {
            type: Boolean,
            default: false
        },
        requiresSignature: {
            type: Boolean,
            default: false
        }
    },
    scheduledPickup: Date,
    actualPickup: Date,
    estimatedDelivery: Date,
    actualDelivery: Date,
    route: {
        distance: Number,
        distanceUnit: {
            type: String,
            enum: ['km', 'miles'],
            default: 'km'
        },
        estimatedDuration: Number, // in minutes
        waypoints: [{
            location: String,
            coordinates: {
                lat: Number,
                lng: Number
            },
            arrivalTime: Date
        }]
    },
    cost: {
        shipping: Number,
        insurance: Number,
        handling: Number,
        total: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    trackingHistory: [trackingEventSchema],
    proofOfDelivery: {
        signature: String,
        photo: String,
        receiverName: String,
        deliveryNotes: String,
        deliveryTime: Date,
        // Blockchain integration fields
        podToken: String,              // Unique POD token ID
        blockchainHash: String,         // Hash of POD data
        previousHash: String,           // Link to previous block
        blockTimestamp: Date,           // Blockchain record timestamp
        blockNumber: Number,            // Sequential block number
        verificationUrl: String         // URL to verify POD
    },
    delayInfo: {
        isDelayed: {
            type: Boolean,
            default: false
        },
        reason: String,
        estimatedNewDelivery: Date,
        notificationSent: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Generate tracking number before saving
shipmentSchema.pre('save', async function (next) {
    if (!this.trackingNumber) {
        const date = new Date();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.trackingNumber = `SHP${date.getFullYear()}${random}`;
    }
    next();
});

// Add tracking event
shipmentSchema.methods.addTrackingEvent = function (event) {
    this.trackingHistory.push(event);
    this.status = event.status;
    if (event.location) {
        this.currentLocation = {
            ...event.location,
            lastUpdated: new Date()
        };
    }
    return this.save();
};

// Index for better query performance

shipmentSchema.index({ order: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ 'currentLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Shipment', shipmentSchema);
