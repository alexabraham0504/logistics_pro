const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/vahak/register
 * @desc    Register vehicle owner (Vahak) details
 * @access  Protected - Admin only
 */
router.post('/register', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            vehicleId,
            ownerName,
            ownerPhone,
            ownerEmail,
            ownerAadhar,
            ownerPAN,
            ownerAddress,
            ownershipProof,
            ownershipType
        } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Encrypt sensitive data
        const encryptedAadhar = ownerAadhar ? CryptoUtil.encryptSensitive(ownerAadhar) : null;
        const encryptedPAN = ownerPAN ? CryptoUtil.encryptSensitive(ownerPAN) : null;

        // Prepare owner data for blockchain
        const ownerData = {
            vehicleId,
            ownerName,
            ownerPhone,
            ownerEmail,
            ownerAddress,
            ownershipType,
            registeredAt: new Date()
        };

        // Get last vehicle for blockchain chain linkage
        const lastVehicle = await Vehicle.findOne({ 'blockchainTracking.blockNumber': { $exists: true, $ne: null } })
            .sort({ 'blockchainTracking.blockNumber': -1 });

        const previousHash = lastVehicle?.blockchainTracking?.vehicleHash || '0';
        const blockNumber = (lastVehicle?.blockchainTracking?.blockNumber || 0) + 1;

        // Create blockchain block (consistent with POD/Blackbug/Export)
        const blockData = {
            vehicleId: vehicleId,
            ownerData,
            registeredAt: new Date()
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // 🔗 BLOCKCHAIN CONSOLE OUTPUT - Live visibility
        console.log('\n' + '═'.repeat(60));
        console.log('🔗 BLOCKCHAIN: NEW VAHAK BLOCK CREATED');
        console.log('═'.repeat(60));
        console.log(`📦 Block Number:  #${block.blockNumber}`);
        console.log(`🚛 Vehicle ID:    ${vehicleId}`);
        console.log(`👤 Owner:         ${ownerName}`);
        console.log(`🔐 Hash:          ${block.hash.substring(0, 32)}...`);
        console.log(`⛓️  Previous Hash: ${previousHash === '0' ? 'GENESIS' : previousHash.substring(0, 32) + '...'}`);
        console.log(`⏰ Timestamp:     ${new Date(block.timestamp).toISOString()}`);
        console.log(`🔢 Nonce:         ${block.nonce}`);
        console.log('═'.repeat(60) + '\n');

        // Update vehicle with Vahak details
        vehicle.vahakDetails = {
            ownerName,
            ownerPhone,
            ownerEmail,
            ownerAadhar: encryptedAadhar,
            ownerPAN: encryptedPAN,
            ownerAddress,
            ownershipProof,
            ownershipType: ownershipType || 'owned',
            blockchainHash: block.hash,
            registeredAt: new Date(),
            verificationStatus: 'pending',
            verifiedBy: null,
            verifiedAt: null
        };

        // Update blockchain tracking with full chain data
        if (!vehicle.blockchainTracking) {
            vehicle.blockchainTracking = {};
        }

        vehicle.blockchainTracking.vehicleHash = block.hash;
        vehicle.blockchainTracking.previousHash = block.previousHash;
        vehicle.blockchainTracking.blockNumber = block.blockNumber;
        vehicle.blockchainTracking.nonce = block.nonce;
        vehicle.blockchainTracking.timestamp = block.timestamp;
        vehicle.blockchainTracking.lastBlockUpdate = new Date();
        vehicle.blockchainTracking.blockchainRecordCount = (vehicle.blockchainTracking.blockchainRecordCount || 0) + 1;

        await vehicle.save();

        res.status(201).json({
            success: true,
            message: 'Vahak (vehicle owner) registered successfully',
            data: {
                vehicleId: vehicle._id,
                vehicleNumber: vehicle.vehicleNumber,
                owner: {
                    name: ownerName,
                    phone: ownerPhone,
                    email: ownerEmail
                },
                blockchainHash,
                verificationStatus: 'pending'
            }
        });
    } catch (error) {
        console.error('Vahak registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register vehicle owner',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vahak/vehicle/:vehicleId
 * @desc    Get Vahak (vehicle owner) details
 * @access  Protected
 */
router.get('/vehicle/:vehicleId', protect, async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId)
            .populate('vahakDetails.verifiedBy', 'firstName lastName email')
            .select('vehicleNumber type vahakDetails blockchainTracking');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (!vehicle.vahakDetails || !vehicle.vahakDetails.ownerName) {
            return res.status(404).json({
                success: false,
                message: 'Vahak details not found for this vehicle'
            });
        }

        // Don't send encrypted sensitive data to client
        const vahakData = {
            ...vehicle.vahakDetails.toObject(),
            ownerAadhar: vehicle.vahakDetails.ownerAadhar ? '****' + vehicle.vahakDetails.ownerAadhar.slice(-4) : null,
            ownerPAN: vehicle.vahakDetails.ownerPAN ? '****' + vehicle.vahakDetails.ownerPAN.slice(-4) : null
        };

        res.json({
            success: true,
            data: {
                vehicle: {
                    id: vehicle._id,
                    vehicleNumber: vehicle.vehicleNumber,
                    type: vehicle.type
                },
                vahakDetails: vahakData,
                blockchainTracking: vehicle.blockchainTracking
            }
        });
    } catch (error) {
        console.error('Vahak retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Vahak details',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/vahak/verify/:vehicleId
 * @desc    Verify vehicle ownership
 * @access  Protected - Admin only
 */
router.put('/verify/:vehicleId', protect, authorize('admin'), async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { status, notes } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification status. Must be "verified" or "rejected"'
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (!vehicle.vahakDetails || !vehicle.vahakDetails.ownerName) {
            return res.status(404).json({
                success: false,
                message: 'No Vahak details found to verify'
            });
        }

        // Update verification status
        vehicle.vahakDetails.verificationStatus = status;
        vehicle.vahakDetails.verifiedAt = new Date();
        vehicle.vahakDetails.verifiedBy = req.user._id;

        // Create new blockchain block for verification event (chain continues)
        const previousHash = vehicle.blockchainTracking?.vehicleHash || '0';
        const blockNumber = (vehicle.blockchainTracking?.blockNumber || 0) + 1;

        const verificationData = {
            vehicleId,
            eventType: 'verification',
            status,
            verifiedBy: req.user._id.toString(),
            verifiedAt: new Date(),
            previousRegistrationHash: vehicle.vahakDetails.blockchainHash
        };

        const block = BlockchainService.createBlock(verificationData, previousHash, blockNumber);

        // 🔗 BLOCKCHAIN CONSOLE OUTPUT - Verification event
        console.log('\n' + '═'.repeat(60));
        console.log('🔗 BLOCKCHAIN: VAHAK VERIFICATION BLOCK');
        console.log('═'.repeat(60));
        console.log(`📦 Block Number:  #${block.blockNumber}`);
        console.log(`🚛 Vehicle ID:    ${vehicleId}`);
        console.log(`✅ Status:        ${status.toUpperCase()}`);
        console.log(`🔐 Hash:          ${block.hash.substring(0, 32)}...`);
        console.log(`⛓️  Previous Hash: ${previousHash.substring(0, 32)}...`);
        console.log('═'.repeat(60) + '\n');

        vehicle.vahakDetails.blockchainHash = block.hash;
        vehicle.blockchainTracking.vehicleHash = block.hash;
        vehicle.blockchainTracking.previousHash = block.previousHash;
        vehicle.blockchainTracking.blockNumber = block.blockNumber;
        vehicle.blockchainTracking.nonce = block.nonce;
        vehicle.blockchainTracking.timestamp = block.timestamp;
        vehicle.blockchainTracking.lastBlockUpdate = new Date();
        vehicle.blockchainTracking.blockchainRecordCount = (vehicle.blockchainTracking.blockchainRecordCount || 0) + 1;

        await vehicle.save();

        res.json({
            success: true,
            message: `Vehicle ownership ${status}`,
            data: {
                vehicleId: vehicle._id,
                verificationStatus: status,
                verifiedAt: vehicle.vahakDetails.verifiedAt,
                blockchainHash: verificationHash
            }
        });
    } catch (error) {
        console.error('Vahak verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify vehicle ownership',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vahak/:vehicleId/blockchain-history
 * @desc    Get blockchain history for vehicle
 * @access  Protected
 */
router.get('/:vehicleId/blockchain-history', protect, async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId)
            .select('vehicleNumber vahakDetails blockchainTracking');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: {
                vehicle: {
                    id: vehicle._id,
                    vehicleNumber: vehicle.vehicleNumber
                },
                blockchainHistory: {
                    currentHash: vehicle.vahakDetails?.blockchainHash,
                    totalRecords: vehicle.blockchainTracking?.blockchainRecordCount || 0,
                    lastUpdate: vehicle.blockchainTracking?.lastBlockUpdate,
                    verificationStatus: vehicle.vahakDetails?.verificationStatus,
                    verifiedAt: vehicle.vahakDetails?.verifiedAt
                }
            }
        });
    } catch (error) {
        console.error('Blockchain history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve blockchain history',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vahak/list
 * @desc    Get all registered Vahak (vehicle owners)
 * @access  Protected
 */
router.get('/list', protect, async (req, res) => {
    console.log('🔍 [Vahak] GET /list request:', req.query);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const vehicles = await Vehicle.find({ 'vahakDetails.ownerName': { $exists: true, $ne: null } })
            .select('vehicleNumber type vahakDetails blockchainTracking')
            .populate('vahakDetails.verifiedBy', 'firstName lastName')
            .skip(skip)
            .limit(limit)
            .sort({ 'vahakDetails.verifiedAt': -1 });

        const total = await Vehicle.countDocuments({ 'vahakDetails.ownerName': { $exists: true, $ne: null } });

        res.json({
            success: true,
            data: {
                vehicles: vehicles.map(v => ({
                    id: v._id,
                    vehicleNumber: v.vehicleNumber,
                    type: v.type,
                    owner: v.vahakDetails?.ownerName,
                    ownerPhone: v.vahakDetails?.ownerPhone,
                    verificationStatus: v.vahakDetails?.verificationStatus,
                    blockchainHash: v.vahakDetails?.blockchainHash
                })),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    recordsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Vahak list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Vahak list',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vahak/verify-chain
 * @desc    Verify entire Vahak blockchain chain integrity
 * @access  Protected - Admin only
 */
router.get('/verify-chain', protect, authorize('admin'), async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ 'blockchainTracking.blockNumber': { $exists: true, $ne: null } })
            .sort({ 'blockchainTracking.blockNumber': 1 });

        if (vehicles.length === 0) {
            return res.json({
                success: true,
                chainValid: true,
                totalBlocks: 0,
                message: 'No Vahak blockchain records found'
            });
        }

        // Build blocks array for chain verification
        const blocks = vehicles.map(vehicle => ({
            blockNumber: vehicle.blockchainTracking.blockNumber,
            timestamp: vehicle.blockchainTracking.timestamp,
            hash: vehicle.blockchainTracking.vehicleHash,
            previousHash: vehicle.blockchainTracking.previousHash,
            nonce: vehicle.blockchainTracking.nonce,
            data: {
                vehicleId: vehicle._id.toString(),
                vehicleNumber: vehicle.vehicleNumber,
                ownerName: vehicle.vahakDetails?.ownerName
            }
        }));

        const chainVerification = BlockchainService.verifyChain(blocks);

        // 🔗 BLOCKCHAIN CONSOLE OUTPUT - Chain verification
        console.log('\n' + '═'.repeat(60));
        console.log('🔗 BLOCKCHAIN: VAHAK CHAIN VERIFICATION');
        console.log('═'.repeat(60));
        console.log(`📊 Total Blocks:  ${blocks.length}`);
        console.log(`✅ Chain Valid:   ${chainVerification.isValid ? 'YES' : 'NO'}`);
        console.log(`📝 Message:       ${chainVerification.message}`);
        console.log('═'.repeat(60) + '\n');

        res.status(200).json({
            success: true,
            chainValid: chainVerification.isValid,
            totalBlocks: blocks.length,
            verification: chainVerification,
            blocks: blocks.map(b => ({
                blockNumber: b.blockNumber,
                hash: b.hash?.substring(0, 16) + '...',
                previousHash: b.previousHash?.substring(0, 16) + '...',
                vehicleNumber: b.data.vehicleNumber,
                ownerName: b.data.ownerName
            }))
        });
    } catch (error) {
        console.error('Vahak chain verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify Vahak blockchain chain',
            error: error.message
        });
    }
});

module.exports = router;
