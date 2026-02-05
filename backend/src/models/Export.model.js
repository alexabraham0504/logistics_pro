const mongoose = require('mongoose');

const exportDocumentSchema = new mongoose.Schema({
    documentType: {
        type: String,
        required: true,
        enum: ['commercial_invoice', 'bill_of_lading', 'packing_list', 'certificate_of_origin', 'export_license', 'customs_declaration', 'insurance_certificate', 'other']
    },
    documentUrl: {
        type: String,
        required: true
    },
    documentHash: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockchainHash: String,
    isVerified: {
        type: Boolean,
        default: true
    }
});

const exportStatusSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: [
            'preparing',
            'documentation_pending',
            'customs_clearance',
            'at_port',
            'in_transit',
            'arrived_destination',
            'delivered',
            'cancelled'
        ]
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: String,
    notes: String,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockchainHash: String,
    previousHash: String
});

const exportSchema = new mongoose.Schema({
    exportId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        index: true
    },
    exportType: {
        type: String,
        required: true,
        enum: ['sea', 'air', 'land', 'multimodal']
    },
    status: {
        type: String,
        enum: ['preparing', 'documentation_pending', 'customs_clearance', 'at_port', 'in_transit', 'arrived_destination', 'delivered', 'cancelled'],
        default: 'preparing'
    },
    exportDetails: {
        exporterName: {
            type: String,
            required: true
        },
        exporterAddress: String,
        exporterContact: String,
        importerName: {
            type: String,
            required: true
        },
        importerAddress: String,
        importerContact: String,
        importerCountry: {
            type: String,
            required: true
        },
        hsCode: String,              // Harmonized System Code
        productDescription: {
            type: String,
            required: true
        },
        quantity: Number,
        unit: String,
        value: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        incoterms: String            // International Commercial Terms
    },
    documents: [exportDocumentSchema],
    statusHistory: [exportStatusSchema],
    customsClearance: {
        clearanceDate: Date,
        clearancePort: String,
        customsOfficer: String,
        clearanceNumber: String,
        clearanceDocument: String,
        blockchainHash: String
    },
    portDetails: {
        portOfLoading: String,
        portOfDischarge: String,
        estimatedDeparture: Date,
        actualDeparture: Date,
        estimatedArrival: Date,
        actualArrival: Date
    },
    containerDetails: {
        containerNumber: String,
        sealNumber: String,
        containerType: String,
        containerSize: String
    },
    blockchainMetadata: {
        initialHash: String,
        currentHash: String,
        totalBlocks: {
            type: Number,
            default: 0
        },
        lastUpdated: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate export ID before saving
exportSchema.pre('save', async function (next) {
    if (!this.exportId) {
        const date = new Date();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.exportId = `EXP-${date.getFullYear()}-${random}`;
    }
    next();
});

// Virtual for blockchain status
exportSchema.virtual('blockchainStatus').get(function () {
    return {
        isOnChain: !!this.blockchainMetadata?.currentHash,
        totalRecords: this.blockchainMetadata?.totalBlocks || 0,
        lastUpdate: this.blockchainMetadata?.lastUpdated
    };
});

// Indexes
exportSchema.index({ status: 1 });
exportSchema.index({ 'exportDetails.importerCountry': 1 });
exportSchema.index({ 'exportDetails.hsCode': 1 });
exportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Export', exportSchema);
