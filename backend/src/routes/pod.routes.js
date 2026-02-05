const express = require('express');
const router = express.Router();
const PODToken = require('../models/PODToken.model');
const Shipment = require('../models/Shipment.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');
const { protect } = require('../middleware/auth.middleware');
const notificationService = require('../services/NotificationService');

/**
 * @route   POST /api/pod/generate
 * @desc    Generate POD token on delivery completion
 * @access  Protected
 */
router.post('/generate', protect, async (req, res) => {
    try {
        const {
            shipmentId,
            receiverName,
            receiverSignature,
            receiverPhone,
            photoUrl,
            location,
            verificationMethod,
            notes
        } = req.body;

        // Validate shipment exists
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        // Check if POD already exists for this shipment
        const existingPOD = await PODToken.findOne({ shipment: shipmentId });
        if (existingPOD) {
            return res.status(400).json({
                success: false,
                message: 'POD token already exists for this shipment',
                podToken: existingPOD.podToken
            });
        }

        // Get the last POD token for blockchain chain
        const lastPOD = await PODToken.findOne().sort({ 'blockchainData.blockNumber': -1 });
        const previousHash = lastPOD ? lastPOD.blockchainData.hash : '0';
        const blockNumber = lastPOD ? lastPOD.blockchainData.blockNumber + 1 : 1;

        // Generate unique POD token
        const podToken = CryptoUtil.generateToken('POD');

        // Prepare delivery data
        const deliveryData = {
            timestamp: new Date(),
            location,
            receiverName,
            receiverSignature,
            receiverPhone,
            photoUrl,
            verificationMethod: verificationMethod || 'signature',
            notes
        };

        // Create blockchain block
        const blockData = {
            podToken,
            shipment: shipmentId,
            deliveryData
        };

        const block = await BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // 🔗 BLOCKCHAIN CONSOLE OUTPUT - Live visibility
        console.log('\n' + '═'.repeat(60));
        console.log('🔗 BLOCKCHAIN: NEW POD BLOCK CREATED');
        console.log('═'.repeat(60));
        console.log(`📦 Block Number:  #${block.blockNumber}`);
        console.log(`📝 POD Token:     ${podToken}`);
        console.log(`👤 Receiver:      ${receiverName}`);
        console.log(`🔐 Hash:          ${block.hash.substring(0, 32)}...`);
        console.log(`⛓️  Previous Hash: ${previousHash === '0' ? 'GENESIS' : previousHash.substring(0, 32) + '...'}`);
        console.log(`⏰ Timestamp:     ${new Date(block.timestamp).toISOString()}`);
        console.log(`🔢 Nonce:         ${block.nonce}`);
        console.log('═'.repeat(60) + '\n');

        // Create POD token record
        const newPOD = new PODToken({
            podToken,
            shipment: shipmentId,
            deliveryData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp,
                rawHashInput: block.rawHashInput  // Store for reliable verification
            },
            verifiedBy: req.user._id,
            verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-pod/${podToken}`
        });

        await newPOD.save();

        // Update shipment with POD token
        shipment.proofOfDelivery = {
            ...shipment.proofOfDelivery,
            receiverName,
            signature: receiverSignature,
            photo: photoUrl,
            deliveryNotes: notes,
            deliveryTime: new Date(),
            podToken,
            blockchainHash: block.hash,
            previousHash: block.previousHash,
            blockTimestamp: block.timestamp,
            blockNumber: block.blockNumber,
            verificationUrl: newPOD.verificationUrl
        };

        shipment.status = 'delivered';
        shipment.actualDelivery = new Date();
        await shipment.save();

        // Emit real-time update via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`shipment_${shipmentId}`).emit('pod_generated', {
                shipmentId,
                podToken,
                status: 'delivered'
            });
        }

        // Send via NotificationService for structured alerts
        notificationService.broadcast('POD_GENERATED', {
            shipmentId,
            trackingNumber: shipment.trackingNumber,
            podToken,
            message: `Delivery confirmed for shipment ${shipment.trackingNumber}`
        });

        res.status(201).json({
            success: true,
            message: 'POD token generated successfully',
            data: {
                podToken: newPOD.podToken,
                verificationUrl: newPOD.verificationUrl,
                blockchainHash: newPOD.blockchainData.hash,
                blockNumber: newPOD.blockchainData.blockNumber,
                timestamp: newPOD.deliveryData.timestamp
            }
        });
    } catch (error) {
        console.error('POD generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate POD token',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/pod/verify/:token
 * @desc    Verify POD token authenticity
 * @access  Public
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const podToken = await PODToken.findOne({ podToken: token })
            .populate('shipment', 'trackingNumber status origin destination')
            .populate('verifiedBy', 'firstName lastName email');

        if (!podToken) {
            return res.status(404).json({
                success: false,
                message: 'POD token not found'
            });
        }

        // Verify blockchain integrity
        const isValid = podToken.verifyIntegrity();

        res.json({
            success: true,
            data: {
                podToken: podToken.podToken,
                isValid,
                isVerified: podToken.isVerified,
                deliveryData: podToken.deliveryData,
                shipment: podToken.shipment,
                blockchainProof: {
                    hash: podToken.blockchainData.hash,
                    previousHash: podToken.blockchainData.previousHash,
                    blockNumber: podToken.blockchainData.blockNumber,
                    timestamp: podToken.blockchainData.timestamp,
                    integrityCheck: isValid ? 'PASSED' : 'FAILED'
                },
                verifiedBy: podToken.verifiedBy,
                verifiedAt: podToken.verifiedAt
            }
        });
    } catch (error) {
        console.error('POD verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify POD token',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/pod/shipment/:shipmentId
 * @desc    Get POD token for a shipment
 * @access  Protected
 */
router.get('/shipment/:shipmentId', protect, async (req, res) => {
    try {
        const { shipmentId } = req.params;

        const podToken = await PODToken.findOne({ shipment: shipmentId })
            .populate('shipment')
            .populate('verifiedBy', 'firstName lastName');

        if (!podToken) {
            return res.status(404).json({
                success: false,
                message: 'POD token not found for this shipment'
            });
        }

        res.json({
            success: true,
            data: podToken
        });
    } catch (error) {
        console.error('POD retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve POD token',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/pod/:token/blockchain-proof
 * @desc    Get detailed blockchain proof for POD token
 * @access  Public
 */
router.get('/:token/blockchain-proof', async (req, res) => {
    try {
        const { token } = req.params;

        const podToken = await PODToken.findOne({ podToken: token });

        if (!podToken) {
            return res.status(404).json({
                success: false,
                message: 'POD token not found'
            });
        }

        // Get surrounding blocks for chain verification
        const previousBlock = await PODToken.findOne({
            'blockchainData.blockNumber': podToken.blockchainData.blockNumber - 1
        });

        const nextBlock = await PODToken.findOne({
            'blockchainData.blockNumber': podToken.blockchainData.blockNumber + 1
        });

        // Verify integrity
        const isValid = podToken.verifyIntegrity();

        // Check chain linkage
        let chainValid = true;
        let chainMessage = 'Chain linkage verified';

        if (previousBlock && podToken.blockchainData.previousHash !== previousBlock.blockchainData.hash) {
            chainValid = false;
            chainMessage = 'Previous hash mismatch - chain broken';
        }

        if (nextBlock && nextBlock.blockchainData.previousHash !== podToken.blockchainData.hash) {
            chainValid = false;
            chainMessage = 'Next block reference mismatch - chain broken';
        }

        res.json({
            success: true,
            data: {
                podToken: podToken.podToken,
                blockchainProof: {
                    currentBlock: {
                        number: podToken.blockchainData.blockNumber,
                        hash: podToken.blockchainData.hash,
                        previousHash: podToken.blockchainData.previousHash,
                        timestamp: podToken.blockchainData.timestamp,
                        nonce: podToken.blockchainData.nonce
                    },
                    previousBlock: previousBlock ? {
                        number: previousBlock.blockchainData.blockNumber,
                        hash: previousBlock.blockchainData.hash
                    } : null,
                    nextBlock: nextBlock ? {
                        number: nextBlock.blockchainData.blockNumber,
                        hash: nextBlock.blockchainData.hash,
                        previousHash: nextBlock.blockchainData.previousHash
                    } : null,
                    integrity: {
                        blockValid: isValid,
                        chainValid,
                        message: isValid && chainValid ? 'Blockchain proof verified' : chainMessage
                    }
                },
                deliveryProof: {
                    timestamp: podToken.deliveryData.timestamp,
                    location: podToken.deliveryData.location,
                    receiver: podToken.deliveryData.receiverName,
                    verificationMethod: podToken.deliveryData.verificationMethod
                }
            }
        });
    } catch (error) {
        console.error('Blockchain proof retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve blockchain proof',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/pod/list
 * @desc    Get all POD tokens with pagination
 * @access  Protected
 */
router.get('/list', protect, async (req, res) => {
    console.log('🔍 [POD] GET /list request:', req.query);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await PODToken.countDocuments();
        const pods = await PODToken.find()
            .populate('shipment', 'trackingNumber status')
            .populate('verifiedBy', 'firstName lastName')
            .sort({ 'deliveryData.timestamp': -1 })
            .skip(skip)
            .limit(limit);

        console.log(`✅ [POD] Found ${pods.length} tokens`);

        res.json({
            success: true,
            data: {
                pods,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    recordsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('❌ [POD] List error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve POD listing',
            error: error.message
        });
    }
});

module.exports = router;
