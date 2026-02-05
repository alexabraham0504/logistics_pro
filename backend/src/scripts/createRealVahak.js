/**
 * Create a REAL Vahak registration with blockchain data saved to DB
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../models/Vehicle.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

async function createRealVahak() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find a vehicle without Vahak blockchain data
    let vehicle = await Vehicle.findOne({
        'blockchainTracking.blockNumber': { $exists: false }
    });

    if (!vehicle) {
        // Use any vehicle
        vehicle = await Vehicle.findOne();
    }

    if (!vehicle) {
        console.log('No vehicles found. Please add a vehicle first.');
        await mongoose.disconnect();
        return;
    }

    console.log('Using vehicle:', vehicle.vehicleNumber);

    // Get last vehicle for chain
    const lastVehicle = await Vehicle.findOne({ 'blockchainTracking.blockNumber': { $exists: true, $ne: null } })
        .sort({ 'blockchainTracking.blockNumber': -1 });

    const previousHash = lastVehicle?.blockchainTracking?.vehicleHash || '0';
    const blockNumber = (lastVehicle?.blockchainTracking?.blockNumber || 0) + 1;

    console.log('Previous Hash:', previousHash === '0' ? 'GENESIS' : previousHash.substring(0, 32) + '...');
    console.log('New Block Number:', blockNumber);

    // Create owner data
    const ownerData = {
        vehicleId: vehicle._id.toString(),
        ownerName: 'Blockchain Test Owner ' + Date.now(),
        ownerPhone: '9876543210',
        ownerEmail: 'test@vahak.com',
        ownerAddress: { street: 'Test Street', city: 'Mumbai', state: 'MH' },
        ownershipType: 'owned',
        registeredAt: new Date()
    };

    // Create blockchain block
    const blockData = {
        vehicleId: vehicle._id.toString(),
        ownerData,
        registeredAt: new Date()
    };

    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    console.log('\n=== BLOCK CREATED ===');
    console.log('Hash:', block.hash.substring(0, 32) + '...');
    console.log('Block Number:', block.blockNumber);

    // Update vehicle
    vehicle.vahakDetails = {
        ownerName: ownerData.ownerName,
        ownerPhone: ownerData.ownerPhone,
        ownerEmail: ownerData.ownerEmail,
        ownerAddress: ownerData.ownerAddress,
        ownershipType: 'owned',
        blockchainHash: block.hash,
        registeredAt: new Date(),
        verificationStatus: 'pending'
    };

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
    console.log('\nVehicle saved with blockchain data!');

    // Verify
    const savedVehicle = await Vehicle.findById(vehicle._id);
    console.log('\n=== VERIFICATION ===');
    console.log('Block Number stored:', savedVehicle.blockchainTracking?.blockNumber);
    console.log('Hash stored:', savedVehicle.blockchainTracking?.vehicleHash?.substring(0, 32) + '...');
    console.log('Owner:', savedVehicle.vahakDetails?.ownerName);

    console.log('\n========================================');
    console.log('VAHAK REGISTRATION SAVED!');
    console.log('Refresh the Blockchain Explorer and click Vahak Owner Chain');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

createRealVahak().catch(console.error);
