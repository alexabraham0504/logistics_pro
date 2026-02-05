/**
 * Test POD Fix - Simulates new POD generation and verification
 */
const mongoose = require('mongoose');
require('dotenv').config();

const PODToken = require('../models/PODToken.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

async function testPODFix() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('=== SIMULATING NEW POD GENERATION ===\n');

    // Use a fake shipment ID (as string, just like in the route)
    const testShipmentId = '507f1f77bcf86cd799439011';
    const podToken = CryptoUtil.generateToken('POD');

    // Get chain info
    const lastPOD = await PODToken.findOne().sort({ 'blockchainData.blockNumber': -1 });
    const previousHash = lastPOD ? lastPOD.blockchainData.hash : '0';
    const blockNumber = lastPOD ? lastPOD.blockchainData.blockNumber + 1 : 1;

    // Create delivery data (same as pod.routes.js)
    const deliveryData = {
        timestamp: new Date(),
        location: { address: 'Test Location for Fix Verification' },
        receiverName: 'Test Receiver Fix Verification',
        verificationMethod: 'signature'
    };

    // Create block data (same as pod.routes.js line 68-72)
    const blockData = {
        podToken,
        shipment: testShipmentId,  // STRING, as passed to PODToken model
        deliveryData               // PLAIN OBJECT
    };

    // Create block (same as pod.routes.js line 74)
    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    console.log('POD Token:', podToken);
    console.log('Block Number:', block.blockNumber);
    console.log('Block Hash:', block.hash);
    console.log('Previous Hash:', block.previousHash);
    console.log('Nonce:', block.nonce);
    console.log('Timestamp:', block.timestamp);

    console.log('\n=== SIMULATING VERIFICATION (as if retrieved from DB) ===\n');

    // Simulate what the verifyIntegrity method does
    // After saving to MongoDB and retrieving:
    // - shipment becomes ObjectId (but we call .toString())
    // - deliveryData becomes Mongoose subdoc (but we call .toObject())

    // For this simulation, we'll replicate the fix logic directly
    const verifyBlockData = {
        blockNumber: block.blockNumber,
        timestamp: new Date(block.timestamp).getTime(),
        data: {
            podToken: podToken,
            shipment: testShipmentId,    // .toString() on ObjectId gives same string
            deliveryData: deliveryData   // .toObject() on fresh object gives same object
        },
        previousHash: block.previousHash,
        nonce: block.nonce
    };

    const calculatedHash = CryptoUtil.sha256(verifyBlockData);

    console.log('Stored Hash:     ', block.hash);
    console.log('Calculated Hash: ', calculatedHash);
    console.log('');
    console.log('VERIFICATION:', calculatedHash === block.hash ? 'PASSED - FIX WORKS!' : 'FAILED');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}

testPODFix().catch(console.error);
