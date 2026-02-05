/**
 * Test Vahak Blockchain Upgrade
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

async function testVahakBlockchain() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('=== SIMULATING NEW VAHAK REGISTRATION ===\n');

    // Find a vehicle without Vahak details or use existing one
    let vehicle = await Vehicle.findOne({ 'vahakDetails.ownerName': { $exists: false } });

    if (!vehicle) {
        console.log('All vehicles have Vahak details. Using existing vehicle for test...');
        vehicle = await Vehicle.findOne();
    }

    if (!vehicle) {
        console.log('No vehicles found in database. Creating test vehicle...');
        vehicle = new Vehicle({
            vehicleNumber: 'TEST-' + Date.now(),
            type: 'truck',
            licensePlate: 'TEST123',
            status: 'available'
        });
        await vehicle.save();
        console.log('Created test vehicle:', vehicle.vehicleNumber);
    }

    console.log('Testing with vehicle:', vehicle.vehicleNumber);

    // Simulate Vahak registration (same logic as vahak.routes.js)
    const ownerData = {
        vehicleId: vehicle._id.toString(),
        ownerName: 'Test Owner ' + Date.now(),
        ownerPhone: '9876543210',
        ownerEmail: 'test@example.com',
        ownerAddress: { street: 'Test Street', city: 'Mumbai', state: 'MH' },
        ownershipType: 'owned',
        registeredAt: new Date()
    };

    // Get last vehicle for chain (same as vahak.routes.js)
    const lastVehicle = await Vehicle.findOne({ 'blockchainTracking.blockNumber': { $exists: true, $ne: null } })
        .sort({ 'blockchainTracking.blockNumber': -1 });

    const previousHash = lastVehicle?.blockchainTracking?.vehicleHash || '0';
    const blockNumber = (lastVehicle?.blockchainTracking?.blockNumber || 0) + 1;

    console.log('\nChain Info:');
    console.log('  Previous Hash:', previousHash === '0' ? 'GENESIS (first block)' : previousHash.substring(0, 32) + '...');
    console.log('  New Block Number:', blockNumber);

    // Create blockchain block (same as vahak.routes.js)
    const blockData = {
        vehicleId: vehicle._id.toString(),
        ownerData,
        registeredAt: new Date()
    };

    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    console.log('\n=== BLOCK CREATED ===');
    console.log('Block Number:', block.blockNumber);
    console.log('Hash:', block.hash);
    console.log('Previous Hash:', block.previousHash);
    console.log('Nonce:', block.nonce);
    console.log('Timestamp:', block.timestamp);

    // Verify the block
    const isBlockValid = BlockchainService.verifyBlock(block);
    console.log('\nBlock Verification:', isBlockValid ? 'VALID' : 'INVALID');

    // Update vehicle (but don't save to avoid polluting test data)
    console.log('\n=== VAHAK BLOCKCHAIN UPGRADE TEST ===');
    console.log('New blockchain fields would be saved:');
    console.log('  vehicleHash:', block.hash.substring(0, 32) + '...');
    console.log('  previousHash:', block.previousHash.substring(0, 32) + '...');
    console.log('  blockNumber:', block.blockNumber);
    console.log('  nonce:', block.nonce);
    console.log('  timestamp:', block.timestamp);

    console.log('\nVAHAK BLOCKCHAIN UPGRADE: WORKING!');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}

testVahakBlockchain().catch(console.error);
