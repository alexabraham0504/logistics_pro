/**
 * Test Script: Blockchain Fixes Verification (ASCII version)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PODToken = require('../models/PODToken.model');
const Vehicle = require('../models/Vehicle.model');
const BlockchainService = require('../services/BlockchainService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics';

async function connectDB() {
    await mongoose.connect(MONGODB_URI);
    console.log('[OK] Connected to MongoDB');
}

async function testPODVerification() {
    console.log('\n=== TEST 1: POD TOKEN VERIFICATION FIX ===');

    const podToken = await PODToken.findOne().sort({ createdAt: -1 });

    if (!podToken) {
        console.log('[SKIP] No POD tokens found in database.');
        return { success: true, skipped: true };
    }

    console.log('Testing POD Token:', podToken.podToken);
    console.log('Stored Hash:', podToken.blockchainData.hash.substring(0, 32) + '...');

    const isValid = podToken.verifyIntegrity();
    console.log('Verification Result:', isValid ? '[PASSED]' : '[FAILED]');

    if (!isValid) {
        console.log('Debug - Shipment ID:', podToken.shipment.toString());
        console.log('Debug - Shipment Type:', typeof podToken.shipment);
    }

    return { success: isValid, podToken: podToken.podToken };
}

async function testVahakBlockchain() {
    console.log('\n=== TEST 2: VAHAK BLOCKCHAIN CHAIN STRUCTURE ===');

    const vehiclesWithBlockchain = await Vehicle.find({
        'blockchainTracking.blockNumber': { $exists: true, $ne: null }
    }).sort({ 'blockchainTracking.blockNumber': 1 });

    console.log('Found', vehiclesWithBlockchain.length, 'vehicles with blockchain chain data');

    if (vehiclesWithBlockchain.length === 0) {
        console.log('[SKIP] No vehicles with new blockchain structure found.');

        const oldStyleCount = await Vehicle.countDocuments({
            'blockchainTracking.vehicleHash': { $exists: true },
            'blockchainTracking.blockNumber': { $exists: false }
        });

        console.log('Found', oldStyleCount, 'vehicles with old hash-only structure');
        return { success: true, skipped: true };
    }

    console.log('\nBlockchain Chain:');
    vehiclesWithBlockchain.forEach(v => {
        console.log('  Block #' + v.blockchainTracking.blockNumber + ':', v.vehicleNumber);
        console.log('    Hash:', v.blockchainTracking.vehicleHash?.substring(0, 24) + '...');
        console.log('    Prev:', v.blockchainTracking.previousHash?.substring(0, 24) + '...');
    });

    const blocks = vehiclesWithBlockchain.map(vehicle => ({
        blockNumber: vehicle.blockchainTracking.blockNumber,
        timestamp: vehicle.blockchainTracking.timestamp,
        hash: vehicle.blockchainTracking.vehicleHash,
        previousHash: vehicle.blockchainTracking.previousHash,
        nonce: vehicle.blockchainTracking.nonce,
        data: { vehicleId: vehicle._id.toString() }
    }));

    const chainVerification = BlockchainService.verifyChain(blocks);
    console.log('\nChain Verification:', chainVerification.isValid ? '[VALID]' : '[INVALID]');
    console.log('Message:', chainVerification.message);

    return { success: chainVerification.isValid, totalBlocks: blocks.length };
}

async function testVehicleIntegrity() {
    console.log('\n=== TEST 3: VEHICLE INTEGRITY METHOD ===');

    const vehicle = await Vehicle.findOne({
        'blockchainTracking.blockNumber': { $exists: true, $ne: null }
    });

    if (!vehicle) {
        console.log('[SKIP] No vehicles with blockchain data.');
        return { success: true, skipped: true };
    }

    console.log('Testing Vehicle:', vehicle.vehicleNumber);
    console.log('Owner:', vehicle.vahakDetails?.ownerName || 'N/A');

    const integrityResult = vehicle.verifyVahakIntegrity();
    console.log('Integrity Check:', integrityResult.valid ? '[PASSED]' : '[FAILED]');
    if (integrityResult.reason) {
        console.log('Reason:', integrityResult.reason);
    }

    return { success: integrityResult.valid !== false, result: integrityResult };
}

async function runTests() {
    console.log('\n========================================');
    console.log('  BLOCKCHAIN FIXES VERIFICATION TESTS  ');
    console.log('========================================');

    await connectDB();

    const results = {
        podVerification: await testPODVerification(),
        vahakBlockchain: await testVahakBlockchain(),
        vehicleIntegrity: await testVehicleIntegrity()
    };

    console.log('\n========================================');
    console.log('  TEST SUMMARY');
    console.log('========================================');

    const tests = [
        { name: 'POD Token Verification', result: results.podVerification },
        { name: 'Vahak Blockchain Chain', result: results.vahakBlockchain },
        { name: 'Vehicle Integrity Method', result: results.vehicleIntegrity }
    ];

    let passed = 0, failed = 0, skipped = 0;

    tests.forEach(test => {
        let status = '[FAIL]';
        if (test.result.skipped) {
            status = '[SKIP]';
            skipped++;
        } else if (test.result.success) {
            status = '[PASS]';
            passed++;
        } else {
            failed++;
        }
        console.log('  ' + status + ' ' + test.name);
    });

    console.log('\n  Total:', tests.length, '| Passed:', passed, '| Failed:', failed, '| Skipped:', skipped);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('[OK] Disconnected from MongoDB\n');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('[ERROR]', err.message);
    process.exit(1);
});
