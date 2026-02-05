const express = require('express');
const router = express.Router();
const TODToken = require('../models/TODToken.model');
const Shipment = require('../models/Shipment.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/tod/generate
 * @desc    Generate a Transfer of Document (TOD) token
 * @access  Protected
 */
router.post('/generate', protect, async (req, res) => {
    try {
        const {
            shipmentId,
            documentType,
            documentUrl,
            receiverId,
            notes
        } = req.body;

        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        // Get last block for chain
        const lastTOD = await TODToken.findOne().sort({ 'blockchainData.blockNumber': -1 });
        const previousHash = lastTOD ? lastTOD.blockchainData.hash : '0';
        const blockNumber = lastTOD ? lastTOD.blockchainData.blockNumber + 1 : 1;

        const todToken = CryptoUtil.generateToken('TOD');

        const documentData = {
            documentType,
            documentUrl,
            documentHash: CryptoUtil.sha256(documentUrl), // Simplified content hash
            sender: req.user._id,
            receiver: receiverId || shipment.driver || req.user._id, // Default to driver or self if no receiver specified
            transferDate: new Date(),
            notes
        };

        const blockData = {
            todToken,
            shipment: shipmentId,
            documentData
        };

        const block = await BlockchainService.createBlock(blockData, previousHash, blockNumber);

        const newTOD = new TODToken({
            todToken,
            shipment: shipmentId,
            documentData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp,
                rawHashInput: block.rawHashInput,
                transactionHash: block.transactionHash
            },
            status: 'transferred'
        });

        await newTOD.save();

        res.status(201).json({
            success: true,
            message: 'Document transferred on blockchain',
            data: newTOD
        });

    } catch (error) {
        console.error('TOD generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate TOD', error: error.message });
    }
});

/**
 * @route   GET /api/tod/verify/:token
 * @desc    Verify TOD token
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const todToken = await TODToken.findOne({ todToken: token })
            .populate('shipment', 'trackingNumber')
            .populate('documentData.sender', 'firstName lastName')
            .populate('documentData.receiver', 'firstName lastName');

        if (!todToken) {
            return res.status(404).json({ success: false, message: 'TOD token not found' });
        }

        const isValid = todToken.verifyIntegrity();

        // Verify against Real Smart Contract
        const SmartContractService = require('../services/SmartContractService');
        console.log(`Verifying on-chain: ${todToken.todToken} with hash ${todToken.blockchainData.hash}`);
        const isChainVerified = await SmartContractService.checkIntegrity(todToken.todToken, 'TOD', todToken.blockchainData.hash);
        console.log(`On-chain verification result: ${isChainVerified}`);

        res.json({
            success: true,
            data: {
                isValid,
                isChainVerified, // New field
                todToken: todToken.todToken,
                documentData: todToken.documentData,
                blockchainData: todToken.blockchainData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
});

/**
 * @route   GET /api/tod/list
 * @desc    List all TOD tokens
 */
router.get('/list', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;

        const tods = await TODToken.find()
            .populate('shipment', 'trackingNumber')
            .populate('documentData.sender', 'firstName lastName')
            .populate('documentData.receiver', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await TODToken.countDocuments();

        res.json({
            success: true,
            data: {
                tods,
                pagination: { current: page, total: Math.ceil(total / limit), totalRecords: total }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

module.exports = router;
