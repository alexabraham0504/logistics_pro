const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver.model');
const DriverBlockchain = require('../models/DriverBlockchain.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');
const { protect } = require('../middleware/auth.middleware');
const notificationService = require('../services/NotificationService');

/**
 * @route   POST /api/blackbug/track
 * @desc    Record driver behavior event
 * @access  Protected
 */
router.post('/track', protect, async (req, res) => {
    try {
        const {
            driverId,
            tripId,
            eventType,
            timestamp,
            location,
            speed,
            distance,
            duration,
            eventDetails
        } = req.body;

        // Validate driver exists
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Get last blockchain record for this driver
        const lastRecord = await DriverBlockchain.findOne({ driver: driverId })
            .sort({ 'blockchainData.blockNumber': -1 });

        const previousHash = lastRecord ? lastRecord.blockchainData.hash : '0';
        const blockNumber = lastRecord ? lastRecord.blockchainData.blockNumber + 1 : 1;

        // Prepare event data
        const eventData = {
            timestamp: timestamp || new Date(),
            location,
            speed,
            distance,
            duration,
            eventDetails
        };

        // Create blockchain block
        const blockData = {
            driver: driverId,
            trip: tripId,
            eventType,
            eventData
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Create blockchain record
        const blockchainRecord = new DriverBlockchain({
            driver: driverId,
            trip: tripId,
            eventType,
            eventData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp
            }
        });

        await blockchainRecord.save();

        // Update driver's behavior monitoring stats
        if (!driver.behaviorMonitoring) {
            driver.behaviorMonitoring = {};
        }

        // Update stats based on event type
        switch (eventType) {
            case 'trip_end':
                driver.behaviorMonitoring.tripCount = (driver.behaviorMonitoring.tripCount || 0) + 1;
                if (distance) {
                    driver.behaviorMonitoring.totalDistance = (driver.behaviorMonitoring.totalDistance || 0) + distance;
                }
                break;
            case 'harsh_braking':
                driver.behaviorMonitoring.harshBrakingEvents = (driver.behaviorMonitoring.harshBrakingEvents || 0) + 1;
                break;
            case 'harsh_acceleration':
                driver.behaviorMonitoring.harshAccelerationEvents = (driver.behaviorMonitoring.harshAccelerationEvents || 0) + 1;
                break;
            case 'overspeeding':
                driver.behaviorMonitoring.overspeedingInstances = (driver.behaviorMonitoring.overspeedingInstances || 0) + 1;
                break;
        }

        driver.behaviorMonitoring.lastMonitoringUpdate = new Date();
        driver.behaviorMonitoring.blockchainHash = block.hash;
        driver.behaviorMonitoring.lastTripHash = block.hash;

        // Update blockchain profile
        if (!driver.blockchainProfile) {
            driver.blockchainProfile = {};
        }
        driver.blockchainProfile.lastBlockHash = block.hash;
        driver.blockchainProfile.blockchainRecordCount = (driver.blockchainProfile.blockchainRecordCount || 0) + 1;
        driver.blockchainProfile.updatedAt = new Date();

        await driver.save();

        // Broadcast safety alert for harsh events
        const harshEvents = ['harsh_braking', 'harsh_acceleration', 'overspeeding'];
        if (harshEvents.includes(eventType)) {
            notificationService.broadcastToRole('admin', 'SAFETY_ALERT', {
                driverId: driver._id,
                driverName: `${driver.firstName} ${driver.lastName}`,
                eventType,
                message: `Safety Alert: Driver ${driver.firstName} recorded ${eventType.replace('_', ' ')}`
            });
        }

        res.status(201).json({
            success: true,
            message: 'Behavior event tracked successfully',
            data: {
                eventType,
                blockchainHash: block.hash,
                blockNumber: block.blockNumber,
                timestamp: block.timestamp
            }
        });
    } catch (error) {
        console.error('Blackbug tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track behavior event',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blackbug/driver/:driverId
 * @desc    Get driver monitoring data
 * @access  Protected
 */
router.get('/driver/:driverId', protect, async (req, res) => {
    console.log(`🔍 [Blackbug] Fetching monitoring for driver: ${req.params.driverId}`);
    try {
        const { driverId } = req.params;

        const driver = await Driver.findById(driverId)
            .select('firstName lastName employeeId behaviorMonitoring blockchainProfile performance');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Calculate safety score based on behavior
        let safetyScore = 100;
        if (driver.behaviorMonitoring) {
            const harshEvents = (driver.behaviorMonitoring.harshBrakingEvents || 0) +
                (driver.behaviorMonitoring.harshAccelerationEvents || 0);
            const overspeedingEvents = driver.behaviorMonitoring.overspeedingInstances || 0;

            safetyScore = Math.max(0, 100 - (harshEvents * 2) - (overspeedingEvents * 3));
        }

        res.json({
            success: true,
            data: {
                driver: {
                    id: driver._id,
                    name: driver.fullName,
                    employeeId: driver.employeeId
                },
                behaviorMetrics: driver.behaviorMonitoring || {},
                safetyScore,
                blockchainStatus: {
                    totalRecords: driver.blockchainProfile?.blockchainRecordCount || 0,
                    lastUpdate: driver.behaviorMonitoring?.lastMonitoringUpdate,
                    lastHash: driver.behaviorMonitoring?.blockchainHash
                }
            }
        });
    } catch (error) {
        console.error('Driver monitoring retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve driver monitoring data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blackbug/driver/:driverId/blockchain
 * @desc    Get blockchain-verified behavior data
 * @access  Protected
 */
router.get('/driver/:driverId/blockchain', protect, async (req, res) => {
    try {
        const { driverId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const driver = await Driver.findById(driverId).select('firstName lastName employeeId');
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Get blockchain records for driver
        const blockchainRecords = await DriverBlockchain.find({ driver: driverId })
            .sort({ 'blockchainData.blockNumber': -1 })
            .limit(limit)
            .populate('trip', 'trackingNumber status');

        // Verify chain integrity
        const blocks = blockchainRecords.reverse(); // Oldest first for chain verification
        const chainVerification = BlockchainService.verifyChain(blocks.map(record => ({
            blockNumber: record.blockchainData.blockNumber,
            hash: record.blockchainData.hash,
            previousHash: record.blockchainData.previousHash,
            timestamp: record.blockchainData.timestamp,
            data: record.eventData,
            nonce: record.blockchainData.nonce
        })));

        res.json({
            success: true,
            data: {
                driver: {
                    id: driver._id,
                    name: driver.fullName,
                    employeeId: driver.employeeId
                },
                blockchainRecords: blocks.reverse(), // Newest first for display
                chainIntegrity: chainVerification,
                totalRecords: blockchainRecords.length
            }
        });
    } catch (error) {
        console.error('Blockchain behavior retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve blockchain behavior data',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/blackbug/trip/:tripId/summary
 * @desc    Store trip summary on blockchain
 * @access  Protected
 */
router.post('/trip/:tripId/summary', protect, async (req, res) => {
    try {
        const { tripId } = req.params;
        const {
            driverId,
            totalDistance,
            totalDuration,
            averageSpeed,
            maxSpeed,
            harshBrakingCount,
            harshAccelerationCount,
            overspeedingCount,
            idleTime,
            fuelConsumed,
            startLocation,
            endLocation
        } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Get last blockchain record
        const lastRecord = await DriverBlockchain.findOne({ driver: driverId })
            .sort({ 'blockchainData.blockNumber': -1 });

        const previousHash = lastRecord ? lastRecord.blockchainData.hash : '0';
        const blockNumber = lastRecord ? lastRecord.blockchainData.blockNumber + 1 : 1;

        // Prepare trip summary data
        const tripSummary = {
            totalDistance,
            totalDuration,
            averageSpeed,
            maxSpeed,
            harshBrakingCount,
            harshAccelerationCount,
            overspeedingCount,
            idleTime,
            fuelConsumed,
            startLocation,
            endLocation,
            completedAt: new Date()
        };

        // Create blockchain block
        const blockData = {
            driver: driverId,
            trip: tripId,
            eventType: 'trip_end',
            eventData: {
                timestamp: new Date(),
                distance: totalDistance,
                duration: totalDuration,
                eventDetails: tripSummary
            }
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Save blockchain record
        const blockchainRecord = new DriverBlockchain({
            driver: driverId,
            trip: tripId,
            eventType: 'trip_end',
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

        // Update driver stats
        if (!driver.behaviorMonitoring) {
            driver.behaviorMonitoring = {};
        }

        driver.behaviorMonitoring.tripCount = (driver.behaviorMonitoring.tripCount || 0) + 1;
        driver.behaviorMonitoring.totalDistance = (driver.behaviorMonitoring.totalDistance || 0) + (totalDistance || 0);
        driver.behaviorMonitoring.harshBrakingEvents = (driver.behaviorMonitoring.harshBrakingEvents || 0) + (harshBrakingCount || 0);
        driver.behaviorMonitoring.harshAccelerationEvents = (driver.behaviorMonitoring.harshAccelerationEvents || 0) + (harshAccelerationCount || 0);
        driver.behaviorMonitoring.overspeedingInstances = (driver.behaviorMonitoring.overspeedingInstances || 0) + (overspeedingCount || 0);

        // Calculate average speed
        const totalTrips = driver.behaviorMonitoring.tripCount;
        const currentAvg = driver.behaviorMonitoring.averageSpeed || 0;
        driver.behaviorMonitoring.averageSpeed = ((currentAvg * (totalTrips - 1)) + (averageSpeed || 0)) / totalTrips;

        driver.behaviorMonitoring.lastMonitoringUpdate = new Date();
        driver.behaviorMonitoring.blockchainHash = block.hash;
        driver.behaviorMonitoring.lastTripHash = block.hash;

        await driver.save();

        res.status(201).json({
            success: true,
            message: 'Trip summary stored on blockchain',
            data: {
                tripId,
                blockchainHash: block.hash,
                blockNumber: block.blockNumber,
                summary: tripSummary
            }
        });
    } catch (error) {
        console.error('Trip summary storage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to store trip summary',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blackbug/analytics/driver/:driverId
 * @desc    Get driver behavior analytics
 * @access  Protected
 */
router.get('/analytics/driver/:driverId', protect, async (req, res) => {
    try {
        const { driverId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const driver = await Driver.findById(driverId)
            .select('firstName lastName employeeId behaviorMonitoring performance');

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Get behavior events from last N days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const recentEvents = await DriverBlockchain.find({
            driver: driverId,
            'eventData.timestamp': { $gte: startDate }
        }).sort({ 'eventData.timestamp': -1 });

        // Calculate analytics
        const eventsByType = {};
        recentEvents.forEach(event => {
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        });

        const analytics = {
            period: `Last ${days} days`,
            totalEvents: recentEvents.length,
            eventsByType,
            currentStats: driver.behaviorMonitoring || {},
            performanceRating: driver.performance?.rating || 0,
            safetyScore: driver.performance?.safetyScore || 100
        };

        res.json({
            success: true,
            data: {
                driver: {
                    id: driver._id,
                    name: driver.fullName,
                    employeeId: driver.employeeId
                },
                analytics
            }
        });
    } catch (error) {
        console.error('Analytics retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve driver analytics',
            error: error.message
        });
    }
});

module.exports = router;
