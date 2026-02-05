const mongoose = require('mongoose');

const todTokenSchema = new mongoose.Schema({
    todToken: {
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
    documentData: {
        documentType: {
            type: String,
            enum: ['bill_of_lading', 'invoice', 'customs_declaration', 'origin_certificate', 'packing_list', 'other'],
            required: true
        },
        documentUrl: {
            type: String,
            required: true
        },
        documentHash: String, // Hash of the file content itself
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Could be client or another stakeholder
            required: true
        },
        transferDate: {
            type: Date,
            default: Date.now
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
        nonce: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        rawHashInput: String,
        transactionHash: String
    },
    status: {
        type: String,
        enum: ['pending', 'transferred', 'accepted', 'rejected'],
        default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Virtual for blockchain status
todTokenSchema.virtual('blockchainStatus').get(function () {
    return {
        isOnChain: !!this.blockchainData.hash,
        blockNumber: this.blockchainData.blockNumber,
        timestamp: this.blockchainData.timestamp,
        hash: this.blockchainData.hash
    };
});

// Method to verify TOD token integrity
todTokenSchema.methods.verifyIntegrity = function () {
    const CryptoUtil = require('../utils/CryptoUtil');

    if (this.blockchainData.rawHashInput) {
        const calculatedHash = CryptoUtil.sha256(this.blockchainData.rawHashInput);
        return calculatedHash === this.blockchainData.hash;
    }

    // Fallback reconstruction
    const blockData = {
        blockNumber: this.blockchainData.blockNumber,
        timestamp: new Date(this.blockchainData.timestamp).getTime(),
        data: {
            todToken: this.todToken,
            shipment: this.shipment.toString(),
            documentData: {
                ...this.documentData.toObject(),
                sender: this.documentData.sender.toString(),
                receiver: this.documentData.receiver.toString()
            }
        },
        previousHash: this.blockchainData.previousHash,
        nonce: this.blockchainData.nonce
    };

    const calculatedHash = CryptoUtil.sha256(blockData);
    return calculatedHash === this.blockchainData.hash;
};

todTokenSchema.index({ 'blockchainData.blockNumber': -1 });

module.exports = mongoose.model('TODToken', todTokenSchema);
