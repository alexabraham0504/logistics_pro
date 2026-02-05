const express = require('express');
const router = express.Router();
const PODToken = require('../models/PODToken.model');
const DriverBlockchain = require('../models/DriverBlockchain.model');
const ExportBlockchain = require('../models/ExportBlockchain.model');
const Vehicle = require('../models/Vehicle.model');
const BlockchainService = require('../services/BlockchainService');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/blockchain/health
 * @desc    Get blockchain system health status
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const [podCount, driverCount, exportCount] = await Promise.all([
            PODToken.countDocuments(),
            DriverBlockchain.countDocuments(),
            ExportBlockchain.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                status: 'operational',
                timestamp: new Date(),
                chains: {
                    pod: { totalBlocks: podCount },
                    driver: { totalBlocks: driverCount },
                    export: { totalBlocks: exportCount }
                },
                totalBlocks: podCount + driverCount + exportCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get blockchain health',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blockchain/validate/:chain
 * @desc    Validate integrity of a specific chain
 * @access  Protected - Admin
 */
router.get('/validate/:chain', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { chain } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        let Model;
        let chainName;
        let isVahak = false;

        switch (chain) {
            case 'pod':
                Model = PODToken;
                chainName = 'POD Token Chain';
                break;
            case 'driver':
                Model = DriverBlockchain;
                chainName = 'Driver Behavior Chain';
                break;
            case 'export':
                Model = ExportBlockchain;
                chainName = 'Export Logistics Chain';
                break;
            case 'vahak':
                Model = Vehicle;
                chainName = 'Vahak Owner Chain';
                isVahak = true;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid chain type. Use: pod, driver, export, or vahak'
                });
        }

        // Fetch blocks in order - different query for Vahak
        let query, sortField;
        if (isVahak) {
            query = { 'blockchainTracking.blockNumber': { $exists: true, $ne: null } };
            sortField = { 'blockchainTracking.blockNumber': 1 };
        } else {
            query = {};
            sortField = { 'blockchainData.blockNumber': 1 };
        }

        const records = await Model.find(query)
            .sort(sortField)
            .limit(limit)
            .lean();

        if (records.length === 0) {
            return res.json({
                success: true,
                data: {
                    chain: chainName,
                    status: 'empty',
                    message: 'No blocks in this chain',
                    totalBlocks: 0
                }
            });
        }

        // Convert to block format for verification
        const blocks = records.map(record => {
            if (isVahak) {
                return {
                    blockNumber: record.blockchainTracking?.blockNumber,
                    timestamp: record.blockchainTracking?.timestamp,
                    data: { vehicleId: record._id, ownerName: record.vahakDetails?.ownerName },
                    previousHash: record.blockchainTracking?.previousHash,
                    hash: record.blockchainTracking?.vehicleHash,
                    nonce: record.blockchainTracking?.nonce
                };
            }
            return {
                blockNumber: record.blockchainData.blockNumber,
                timestamp: record.blockchainData.timestamp,
                data: chain === 'pod'
                    ? { podToken: record.podToken, deliveryData: record.deliveryData }
                    : record.eventData || record.eventType,
                previousHash: record.blockchainData.previousHash,
                hash: record.blockchainData.hash,
                nonce: record.blockchainData.nonce
            };
        });

        // Verify chain integrity
        const validation = BlockchainService.verifyChain(blocks);

        // 🔗 BLOCKCHAIN CONSOLE OUTPUT - Chain Validation
        console.log('\n' + '═'.repeat(60));
        console.log('🔍 BLOCKCHAIN: CHAIN VALIDATION COMPLETE');
        console.log('═'.repeat(60));
        console.log(`📊 Chain:         ${chainName}`);
        console.log(`📦 Blocks:        ${records.length}`);
        console.log(`✅ Status:        ${validation.isValid ? 'VALID ✓' : 'COMPROMISED ✗'}`);
        console.log(`📝 Message:       ${validation.message}`);
        console.log('═'.repeat(60) + '\n');

        // Get chain statistics
        const stats = BlockchainService.getChainStatistics(blocks);

        // Check individual block integrity
        const blockStatuses = blocks.map((block, index) => {
            const isValid = BlockchainService.verifyBlock(block);
            return {
                blockNumber: block.blockNumber,
                hash: block.hash.substring(0, 16) + '...',
                isValid,
                linkedCorrectly: index === 0 || block.previousHash === blocks[index - 1].hash
            };
        });

        const tamperedBlocks = blockStatuses.filter(b => !b.isValid || !b.linkedCorrectly);

        res.json({
            success: true,
            data: {
                chain: chainName,
                status: validation.isValid ? 'valid' : 'compromised',
                message: validation.message,
                totalBlocks: records.length,
                validatedBlocks: limit,
                statistics: {
                    firstBlock: stats.firstBlock,
                    lastBlock: stats.lastBlock,
                    totalTimespan: `${Math.round(stats.totalTimespan / 1000 / 60)} minutes`,
                    averageBlockTime: `${Math.round(stats.averageBlockTime / 1000)} seconds`
                },
                integrity: {
                    allBlocksValid: tamperedBlocks.length === 0,
                    tamperedCount: tamperedBlocks.length,
                    tamperedBlocks: tamperedBlocks
                },
                blockSummary: blockStatuses.slice(0, 10) // First 10 blocks
            }
        });
    } catch (error) {
        console.error('Chain validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate chain',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blockchain/validate-all
 * @desc    Validate all blockchain chains
 * @access  Protected - Admin
 */
router.get('/validate-all', protect, authorize('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const results = {};

        // Validate POD Chain
        const podRecords = await PODToken.find()
            .sort({ 'blockchainData.blockNumber': 1 })
            .limit(limit)
            .lean();

        const podBlocks = podRecords.map(r => ({
            blockNumber: r.blockchainData.blockNumber,
            timestamp: r.blockchainData.timestamp,
            data: { podToken: r.podToken },
            previousHash: r.blockchainData.previousHash,
            hash: r.blockchainData.hash,
            nonce: r.blockchainData.nonce
        }));

        results.pod = {
            totalBlocks: podRecords.length,
            ...BlockchainService.verifyChain(podBlocks)
        };

        // Validate Driver Chain
        const driverRecords = await DriverBlockchain.find()
            .sort({ 'blockchainData.blockNumber': 1 })
            .limit(limit)
            .lean();

        const driverBlocks = driverRecords.map(r => ({
            blockNumber: r.blockchainData.blockNumber,
            timestamp: r.blockchainData.timestamp,
            data: r.eventData,
            previousHash: r.blockchainData.previousHash,
            hash: r.blockchainData.hash,
            nonce: r.blockchainData.nonce
        }));

        results.driver = {
            totalBlocks: driverRecords.length,
            ...BlockchainService.verifyChain(driverBlocks)
        };

        // Validate Export Chain
        const exportRecords = await ExportBlockchain.find()
            .sort({ 'blockchainData.blockNumber': 1 })
            .limit(limit)
            .lean();

        const exportBlocks = exportRecords.map(r => ({
            blockNumber: r.blockchainData.blockNumber,
            timestamp: r.blockchainData.timestamp,
            data: r.eventData,
            previousHash: r.blockchainData.previousHash,
            hash: r.blockchainData.hash,
            nonce: r.blockchainData.nonce
        }));

        results.export = {
            totalBlocks: exportRecords.length,
            ...BlockchainService.verifyChain(exportBlocks)
        };

        // Overall status
        const allValid = results.pod.isValid && results.driver.isValid && results.export.isValid;

        res.json({
            success: true,
            data: {
                overallStatus: allValid ? 'All chains valid ✓' : 'Integrity issues detected ✗',
                timestamp: new Date(),
                chains: results,
                summary: {
                    totalBlocksValidated: podRecords.length + driverRecords.length + exportRecords.length,
                    chainsValidated: 3,
                    allChainsValid: allValid
                }
            }
        });
    } catch (error) {
        console.error('Full validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate all chains',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blockchain/explorer
 * @desc    Get blockchain explorer data for visualization
 * @access  Public (read-only data)
 */
router.get('/explorer', async (req, res) => {
    try {
        const chain = req.query.chain || 'pod';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let Model, chainName;

        let isVahak = false;
        switch (chain) {
            case 'pod':
                Model = PODToken;
                chainName = 'POD Token';
                break;
            case 'driver':
                Model = DriverBlockchain;
                chainName = 'Driver Behavior';
                break;
            case 'export':
                Model = ExportBlockchain;
                chainName = 'Export Logistics';
                break;
            case 'vahak':
                Model = Vehicle;
                chainName = 'Vahak (Vehicle Owner)';
                isVahak = true;
                break;
            default:
                Model = PODToken;
                chainName = 'POD Token';
        }

        // Different query for Vahak (uses blockchainTracking instead of blockchainData)
        let query, sortField;
        if (isVahak) {
            query = { 'blockchainTracking.blockNumber': { $exists: true, $ne: null } };
            sortField = { 'blockchainTracking.blockNumber': -1 };
        } else {
            query = {};
            sortField = { 'blockchainData.blockNumber': -1 };
        }

        const [records, total] = await Promise.all([
            Model.find(query)
                .sort(sortField)
                .skip(skip)
                .limit(limit)
                .lean(),
            Model.countDocuments(query)
        ]);

        // Format for explorer display
        console.log(`\n🔍 Explorer: Found ${records.length} blocks in ${chainName}`);

        const blocks = records.map(record => {
            let block;

            if (isVahak) {
                // Vahak uses blockchainTracking
                block = {
                    blockNumber: record.blockchainTracking?.blockNumber || 0,
                    timestamp: record.blockchainTracking?.timestamp || record.createdAt,
                    previousHash: record.blockchainTracking?.previousHash || '0',
                    hash: record.blockchainTracking?.vehicleHash || 'N/A',
                    nonce: record.blockchainTracking?.nonce || 0,
                    isValid: record.blockchainTracking?.vehicleHash ? true : false
                };
                block.displayData = {
                    vehicle: record.vehicleNumber,
                    owner: record.vahakDetails?.ownerName,
                    status: record.vahakDetails?.verificationStatus
                };
            } else {
                block = {
                    blockNumber: record.blockchainData?.blockNumber || 0,
                    timestamp: record.blockchainData?.timestamp || record.createdAt,
                    previousHash: record.blockchainData?.previousHash || '0',
                    hash: record.blockchainData?.hash || 'N/A',
                    nonce: record.blockchainData?.nonce || 0,
                    isValid: record.blockchainData?.hash ? true : false
                };

                // Add display data
                if (chain === 'pod') {
                    block.displayData = {
                        token: record.podToken,
                        receiver: record.deliveryData?.receiverName,
                        timestamp: record.deliveryData?.timestamp
                    };
                } else if (chain === 'driver') {
                    block.displayData = {
                        eventType: record.eventType,
                        driver: record.driver?.toString()?.substring(0, 8),
                        trip: record.trip?.toString()?.substring(0, 8)
                    };
                } else {
                    block.displayData = {
                        eventType: record.eventType,
                        export: record.export?.toString()?.substring(0, 8)
                    };
                }
            }

            return block;
        });

        res.json({
            success: true,
            data: {
                chain: chainName,
                blocks,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalBlocks: total,
                    blocksPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Explorer data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get explorer data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blockchain/stats
 * @desc    Get blockchain statistics for dashboard
 * @access  Protected
 */
router.get('/stats', protect, async (req, res) => {
    try {
        const [podStats, driverStats, exportStats] = await Promise.all([
            PODToken.aggregate([
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
                    }
                }
            ]),
            DriverBlockchain.aggregate([
                {
                    $group: {
                        _id: '$eventType',
                        count: { $sum: 1 }
                    }
                }
            ]),
            ExportBlockchain.aggregate([
                {
                    $group: {
                        _id: '$eventType',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Get latest blocks from each chain
        const [latestPod, latestDriver, latestExport] = await Promise.all([
            PODToken.findOne().sort({ createdAt: -1 }).lean(),
            DriverBlockchain.findOne().sort({ createdAt: -1 }).lean(),
            ExportBlockchain.findOne().sort({ createdAt: -1 }).lean()
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    totalPODTokens: podStats[0]?.count || 0,
                    verifiedPODs: podStats[0]?.verified || 0,
                    driverEvents: driverStats.reduce((sum, s) => sum + s.count, 0),
                    exportEvents: exportStats.reduce((sum, s) => sum + s.count, 0)
                },
                driverEventBreakdown: driverStats,
                exportEventBreakdown: exportStats,
                latestActivity: {
                    pod: latestPod ? {
                        token: latestPod.podToken,
                        hash: latestPod.blockchainData?.hash?.substring(0, 16) + '...',
                        timestamp: latestPod.createdAt
                    } : null,
                    driver: latestDriver ? {
                        eventType: latestDriver.eventType,
                        hash: latestDriver.blockchainData?.hash?.substring(0, 16) + '...',
                        timestamp: latestDriver.createdAt
                    } : null,
                    export: latestExport ? {
                        eventType: latestExport.eventType,
                        hash: latestExport.blockchainData?.hash?.substring(0, 16) + '...',
                        timestamp: latestExport.createdAt
                    } : null
                }
            }
        });
    } catch (error) {
        console.error('Stats retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get blockchain stats',
            error: error.message
        });
    }
});

module.exports = router;
