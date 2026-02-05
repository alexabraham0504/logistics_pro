const mongoose = require('mongoose');

const exportBlockchainSchema = new mongoose.Schema({
    export: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Export',
        required: true,
        index: true
    },
    eventType: {
        type: String,
        required: true,
        enum: [
            'export_created',
            'document_upload',
            'status_update',
            'customs_clearance',
            'port_departure',
            'port_arrival',
            'delivery_complete'
        ],
        index: true
    },
    eventData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
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
        timestamp: {
            type: Date,
            default: Date.now
        },
        merkleRoot: String,
        nonce: Number
    },
    verificationProof: String,
    isVerified: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
exportBlockchainSchema.index({ export: 1, 'blockchainData.blockNumber': -1 });
exportBlockchainSchema.index({ 'blockchainData.timestamp': -1 });


// Method to verify block integrity
exportBlockchainSchema.methods.verifyIntegrity = function () {
    const CryptoUtil = require('../utils/CryptoUtil');

    const blockData = {
        blockNumber: this.blockchainData.blockNumber,
        timestamp: new Date(this.blockchainData.timestamp).getTime(),
        data: {
            export: this.export,
            eventType: this.eventType,
            eventData: this.eventData
        },
        previousHash: this.blockchainData.previousHash,
        nonce: this.blockchainData.nonce
    };

    const calculatedHash = CryptoUtil.sha256(blockData);
    return calculatedHash === this.blockchainData.hash;
};

module.exports = mongoose.model('ExportBlockchain', exportBlockchainSchema);
