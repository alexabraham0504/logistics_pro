const express = require('express');
const router = express.Router();
const Export = require('../models/Export.model');
const ExportBlockchain = require('../models/ExportBlockchain.model');
// Explicitly require related models to ensure they are registered for populate
const Shipment = require('../models/Shipment.model');
const User = require('../models/User.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');
const { protect, authorize } = require('../middleware/auth.middleware');
const notificationService = require('../services/NotificationService');

/**
 * @route   POST /api/export/create
 * @desc    Create new export record with blockchain
 * @access  Protected
 */
router.post('/create', protect, async (req, res) => {
    try {
        const {
            shipmentId,
            exportType,
            exporterName,
            exporterAddress,
            exporterContact,
            importerName,
            importerAddress,
            importerContact,
            importerCountry,
            hsCode,
            productDescription,
            quantity,
            unit,
            value,
            currency,
            incoterms,
            portOfLoading,
            portOfDischarge
        } = req.body;

        // Create export record
        const newExport = new Export({
            shipment: shipmentId,
            exportType,
            exportDetails: {
                exporterName,
                exporterAddress,
                exportContact,
                importerName,
                importerAddress,
                importerContact,
                importerCountry,
                hsCode,
                productDescription,
                quantity,
                unit,
                value,
                currency: currency || 'USD',
                incoterms
            },
            portDetails: {
                portOfLoading,
                portOfDischarge
            },
            createdBy: req.user._id
        });

        await newExport.save();

        // Get last blockchain record for export chain
        const lastRecord = await ExportBlockchain.findOne()
            .sort({ 'blockchainData.blockNumber': -1 });

        const previousHash = lastRecord ? lastRecord.blockchainData.hash : '0';
        const blockNumber = lastRecord ? lastRecord.blockchainData.blockNumber + 1 : 1;

        // Create blockchain block for export creation
        const blockData = {
            export: newExport._id,
            eventType: 'export_created',
            eventData: {
                exportId: newExport.exportId,
                exportType,
                exporter: exporterName,
                importer: importerName,
                product: productDescription,
                value,
                currency
            }
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Save blockchain record
        const blockchainRecord = new ExportBlockchain({
            export: newExport._id,
            eventType: 'export_created',
            eventData: blockData.eventData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp
            }
        });

        await blockchainRecord.save();

        // Update export with blockchain metadata
        newExport.blockchainMetadata = {
            initialHash: block.hash,
            currentHash: block.hash,
            totalBlocks: 1,
            lastUpdated: new Date()
        };

        // Add initial status
        newExport.statusHistory.push({
            status: 'preparing',
            timestamp: new Date(),
            location: portOfLoading || 'Origin',
            updatedBy: req.user._id,
            blockchainHash: block.hash,
            previousHash
        });

        await newExport.save();

        res.status(201).json({
            success: true,
            message: 'Export created successfully',
            data: {
                exportId: newExport.exportId,
                _id: newExport._id,
                blockchainHash: block.hash,
                blockNumber: block.blockNumber
            }
        });
    } catch (error) {
        console.error('Export creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create export',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/export/:id/document
 * @desc    Upload and hash export document
 * @access  Protected
 */
router.post('/:id/document', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, documentUrl, documentData } = req.body;

        const exportRecord = await Export.findById(id);
        if (!exportRecord) {
            return res.status(404).json({
                success: false,
                message: 'Export record not found'
            });
        }

        // Hash the document
        const documentHash = documentData
            ? CryptoUtil.sha256(documentData)
            : CryptoUtil.sha256({ documentType, documentUrl, timestamp: Date.now() });

        // Get last blockchain record for this export
        const lastRecord = await ExportBlockchain.findOne({ export: id })
            .sort({ 'blockchainData.blockNumber': -1 });

        const previousHash = lastRecord ? lastRecord.blockchainData.hash : exportRecord.blockchainMetadata.currentHash;
        const blockNumber = lastRecord ? lastRecord.blockchainData.blockNumber + 1 : 1;

        // Create blockchain block for document upload
        const blockData = {
            export: id,
            eventType: 'document_upload',
            eventData: {
                documentType,
                documentHash,
                uploadedAt: new Date()
            }
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Save blockchain record
        const blockchainRecord = new ExportBlockchain({
            export: id,
            eventType: 'document_upload',
            eventData: blockData.eventData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp
            }
        });

        await blockchainRecord.save();

        // Add document to export
        exportRecord.documents.push({
            documentType,
            documentUrl,
            documentHash,
            uploadedAt: new Date(),
            uploadedBy: req.user._id,
            blockchainHash: block.hash,
            isVerified: true
        });

        // Update blockchain metadata
        exportRecord.blockchainMetadata.currentHash = block.hash;
        exportRecord.blockchainMetadata.totalBlocks += 1;
        exportRecord.blockchainMetadata.lastUpdated = new Date();

        await exportRecord.save();

        res.status(201).json({
            success: true,
            message: 'Document uploaded and hashed successfully',
            data: {
                documentType,
                documentHash,
                blockchainHash: block.hash,
                blockNumber: block.blockNumber
            }
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/export/:id/status
 * @desc    Update export status with blockchain
 * @access  Protected
 */
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, location, notes } = req.body;

        const exportRecord = await Export.findById(id);
        if (!exportRecord) {
            return res.status(404).json({
                success: false,
                message: 'Export record not found'
            });
        }

        // Validate status
        const validStatuses = ['preparing', 'documentation_pending', 'customs_clearance', 'at_port', 'in_transit', 'arrived_destination', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // Get last blockchain record
        const lastRecord = await ExportBlockchain.findOne({ export: id })
            .sort({ 'blockchainData.blockNumber': -1 });

        const previousHash = lastRecord ? lastRecord.blockchainData.hash : exportRecord.blockchainMetadata.currentHash;
        const blockNumber = lastRecord ? lastRecord.blockchainData.blockNumber + 1 : 1;

        // Create blockchain block for status update
        const blockData = {
            export: id,
            eventType: 'status_update',
            eventData: {
                oldStatus: exportRecord.status,
                newStatus: status,
                location,
                notes,
                updatedAt: new Date()
            }
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Save blockchain record
        const blockchainRecord = new ExportBlockchain({
            export: id,
            eventType: 'status_update',
            eventData: blockData.eventData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp
            }
        });

        await blockchainRecord.save();

        // Update export status
        exportRecord.status = status;
        exportRecord.statusHistory.push({
            status,
            timestamp: new Date(),
            location,
            notes,
            updatedBy: req.user._id,
            blockchainHash: block.hash,
            previousHash: block.previousHash
        });

        // Update blockchain metadata
        exportRecord.blockchainMetadata.currentHash = block.hash;
        exportRecord.blockchainMetadata.totalBlocks += 1;
        exportRecord.blockchainMetadata.lastUpdated = new Date();

        await exportRecord.save();

        // Emit real-time notification
        notificationService.broadcast('STATUS_UPDATE', {
            exportId: exportRecord.exportId,
            status,
            location,
            message: `Export ${exportRecord.exportId} status updated to ${status}`
        });

        // Target specific user (the creator)
        if (exportRecord.createdBy) {
            notificationService.sendToUser(exportRecord.createdBy.toString(), 'EXPORT_UPDATE', {
                exportId: exportRecord.exportId,
                status,
                message: `Your export ${exportRecord.exportId} is now ${status.replace('_', ' ')}`
            });
        }

        res.json({
            success: true,
            message: 'Export status updated successfully',
            data: {
                exportId: exportRecord.exportId,
                status,
                blockchainHash: block.hash,
                blockNumber: block.blockNumber
            }
        });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update export status',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/export/list
 * @desc    Get all exports with pagination
 * @access  Protected
 */
router.get('/list', protect, async (req, res) => {
    console.log('🔍 [Export] GET /list request:', req.query);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = status ? { status } : {};
        console.log('🔍 [Export] Query:', query);

        const total = await Export.countDocuments(query);
        const exports = await Export.find(query)
            .populate('shipment', 'trackingNumber')
            .populate('createdBy', 'firstName lastName')
            .select('exportId exportType status exportDetails blockchainMetadata createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log(`✅ [Export] Found ${exports.length} exports`);

        res.json({
            success: true,
            data: {
                exports,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    recordsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('❌ [Export] List error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve exports',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/export/:id
 * @desc    Get export details
 * @access  Protected
 */
router.get('/:id', protect, async (req, res) => {
    console.log(`🔍 [Export] GET /${req.params.id} request`);
    try {
        const { id } = req.params;

        const exportRecord = await Export.findById(id)
            .populate('shipment', 'trackingNumber status')
            .populate('createdBy', 'firstName lastName email')
            .populate('statusHistory.updatedBy', 'firstName lastName')
            .populate('documents.uploadedBy', 'firstName lastName');

        if (!exportRecord) {
            return res.status(404).json({
                success: false,
                message: 'Export record not found'
            });
        }

        res.json({
            success: true,
            data: exportRecord
        });
    } catch (error) {
        console.error('Export retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve export',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/export/:id/blockchain-trace
 * @desc    Get full blockchain trace for export
 * @access  Protected
 */
router.get('/:id/blockchain-trace', protect, async (req, res) => {
    try {
        const { id } = req.params;

        const exportRecord = await Export.findById(id).select('exportId blockchainMetadata');
        if (!exportRecord) {
            return res.status(404).json({
                success: false,
                message: 'Export record not found'
            });
        }

        // Get all blockchain records for this export
        const blockchainRecords = await ExportBlockchain.find({ export: id })
            .sort({ 'blockchainData.blockNumber': 1 });

        // Verify chain integrity
        const blocks = blockchainRecords.map(record => ({
            blockNumber: record.blockchainData.blockNumber,
            hash: record.blockchainData.hash,
            previousHash: record.blockchainData.previousHash,
            timestamp: record.blockchainData.timestamp,
            data: record.eventData,
            nonce: record.blockchainData.nonce
        }));

        const chainVerification = BlockchainService.verifyChain(blocks);

        res.json({
            success: true,
            data: {
                exportId: exportRecord.exportId,
                blockchainTrace: blockchainRecords,
                chainIntegrity: chainVerification,
                metadata: exportRecord.blockchainMetadata
            }
        });
    } catch (error) {
        console.error('Blockchain trace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve blockchain trace',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/export/:id/verify-document/:docId
 * @desc    Verify document integrity
 * @access  Public
 */
router.get('/:id/verify-document/:docId', async (req, res) => {
    try {
        const { id, docId } = req.params;

        const exportRecord = await Export.findById(id);
        if (!exportRecord) {
            return res.status(404).json({
                success: false,
                message: 'Export record not found'
            });
        }

        const document = exportRecord.documents.id(docId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Find blockchain record for this document
        const blockchainRecord = await ExportBlockchain.findOne({
            export: id,
            eventType: 'document_upload',
            'eventData.documentHash': document.documentHash
        });

        let blockchainVerified = false;
        if (blockchainRecord) {
            blockchainVerified = blockchainRecord.verifyIntegrity();
        }

        res.json({
            success: true,
            data: {
                document: {
                    type: document.documentType,
                    hash: document.documentHash,
                    uploadedAt: document.uploadedAt,
                    blockchainHash: document.blockchainHash
                },
                verification: {
                    isVerified: document.isVerified,
                    blockchainVerified,
                    message: blockchainVerified ? 'Document verified on blockchain' : 'Document not found on blockchain or tampered'
                }
            }
        });
    } catch (error) {
        console.error('Document verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify document',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/export/list
 * @desc    Get all exports with pagination
 * @access  Protected
 */


module.exports = router;
