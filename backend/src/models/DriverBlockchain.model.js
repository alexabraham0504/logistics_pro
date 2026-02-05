const mongoose = require('mongoose');

const driverBlockchainSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        index: true
    },
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    eventType: {
        type: String,
        required: true,
        enum: [
            'trip_start',
            'trip_end',
            'behavior_update',
            'harsh_braking',
            'harsh_acceleration',
            'overspeeding',
            'idle_time',
            'night_driving',
            'profile_verification',
            'location_update'
        ],
        index: true
    },
    eventData: {
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        },
        location: {
            address: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        speed: Number,
        distance: Number,
        duration: Number,
        eventDetails: mongoose.Schema.Types.Mixed
    },
    blockchainData: {
        hash: {
            type: String,
            required: true,
            index: true
        },
        previousHash: {
            type: String,
            required: true
        },
        blockNumber: {
            type: Number,
            required: true,
            index: true
        },
        nonce: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    isVerified: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
driverBlockchainSchema.index({ driver: 1, 'blockchainData.blockNumber': -1 });
driverBlockchainSchema.index({ 'eventData.timestamp': -1 });
driverBlockchainSchema.index({ trip: 1 });

// Method to verify block integrity
driverBlockchainSchema.methods.verifyIntegrity = function () {
    const CryptoUtil = require('../utils/CryptoUtil');

    const blockData = {
        blockNumber: this.blockchainData.blockNumber,
        timestamp: new Date(this.blockchainData.timestamp).getTime(),
        data: {
            driver: this.driver,
            trip: this.trip,
            eventType: this.eventType,
            eventData: this.eventData
        },
        previousHash: this.blockchainData.previousHash,
        nonce: this.blockchainData.nonce
    };

    const calculatedHash = CryptoUtil.sha256(blockData);
    return calculatedHash === this.blockchainData.hash;
};

module.exports = mongoose.model('DriverBlockchain', driverBlockchainSchema);
