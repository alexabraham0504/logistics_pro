const mongoose = require('mongoose');

const podTokenSchema = new mongoose.Schema({
    podToken: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true,
        index: true
    },
    deliveryData: {
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
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
        receiverName: {
            type: String,
            required: true
        },
        receiverSignature: String,
        receiverPhone: String,
        photoUrl: String,
        verificationMethod: {
            type: String,
            enum: ['signature', 'otp', 'biometric', 'photo', 'manual'],
            default: 'signature'
        },
        notes: String
    },
    blockchainData: {
        hash: {
            type: String,
            required: true,
            index: true
        },
        previousHash: {
            type: String,
            default: '0'
        },
        blockNumber: {
            type: Number,
            required: true
        },
        merkleRoot: String,
        nonce: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        // Store the exact JSON that was hashed for reliable verification
        rawHashInput: {
            type: String
        }
    },
    isVerified: {
        type: Boolean,
        default: true
    },
    verifiedAt: {
        type: Date,
        default: Date.now
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationUrl: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for blockchain verification status
podTokenSchema.virtual('blockchainStatus').get(function () {
    return {
        isOnChain: !!this.blockchainData.hash,
        blockNumber: this.blockchainData.blockNumber,
        timestamp: this.blockchainData.timestamp,
        hash: this.blockchainData.hash
    };
});

// Method to verify POD token integrity
podTokenSchema.methods.verifyIntegrity = function () {
    const CryptoUtil = require('../utils/CryptoUtil');

    // If rawHashInput is stored (new PODs), use it directly for reliable verification
    if (this.blockchainData.rawHashInput) {
        const calculatedHash = CryptoUtil.sha256(this.blockchainData.rawHashInput);
        return calculatedHash === this.blockchainData.hash;
    }

    // Fallback for old PODs: try to reconstruct the hash input
    // Note: This may fail due to key ordering differences after MongoDB roundtrip
    let shipmentId;
    if (this.shipment && typeof this.shipment === 'object' && this.shipment._id) {
        shipmentId = this.shipment._id.toString();
    } else if (this.shipment) {
        shipmentId = this.shipment.toString();
    } else {
        shipmentId = '';
    }

    let deliveryDataPlain;
    if (this.deliveryData && typeof this.deliveryData.toObject === 'function') {
        deliveryDataPlain = this.deliveryData.toObject();
    } else {
        deliveryDataPlain = this.deliveryData;
    }

    const blockData = {
        blockNumber: this.blockchainData.blockNumber,
        timestamp: new Date(this.blockchainData.timestamp).getTime(),
        data: {
            podToken: this.podToken,
            shipment: shipmentId,
            deliveryData: deliveryDataPlain
        },
        previousHash: this.blockchainData.previousHash,
        nonce: this.blockchainData.nonce
    };

    const calculatedHash = CryptoUtil.sha256(blockData);
    return calculatedHash === this.blockchainData.hash;
};

// Indexes for performance
podTokenSchema.index({ 'deliveryData.timestamp': -1 });
podTokenSchema.index({ isVerified: 1 });
podTokenSchema.index({ 'blockchainData.blockNumber': 1 });

module.exports = mongoose.model('PODToken', podTokenSchema);
