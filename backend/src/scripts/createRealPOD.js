/**
 * Create a REAL new POD token with rawHashInput stored for reliable verification
 */
const mongoose = require('mongoose');
require('dotenv').config();

const PODToken = require('../models/PODToken.model');
const Shipment = require('../models/Shipment.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

async function createRealPOD() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find any shipment
    let shipment = await Shipment.findOne();

    if (!shipment) {
        console.log('No shipments found. Creating a test shipment...');
        shipment = new Shipment({
            trackingNumber: 'TEST-' + Date.now(),
            status: 'in_transit',
            origin: { address: 'Mumbai' },
            destination: { address: 'Delhi' }
        });
        await shipment.save();
    }

    console.log('Using shipment:', shipment.trackingNumber);
    console.log('Shipment ID:', shipment._id.toString());

    // Get chain info
    const lastPOD = await PODToken.findOne().sort({ 'blockchainData.blockNumber': -1 });
    const previousHash = lastPOD ? lastPOD.blockchainData.hash : '0';
    const blockNumber = lastPOD ? lastPOD.blockchainData.blockNumber + 1 : 1;

    // Generate POD token
    const podTokenString = CryptoUtil.generateToken('POD');

    // Create delivery data (same structure as pod.routes.js)
    const deliveryData = {
        timestamp: new Date(),
        location: {
            address: 'Test Address, Mumbai - FIXED',
            city: 'Mumbai',
            state: 'Maharashtra',
            coordinates: { lat: 19.076, lng: 72.8777 }
        },
        receiverName: 'NEW POD - Should PASS Verification',
        receiverPhone: '9876543210',
        verificationMethod: 'signature',
        notes: 'Created with rawHashInput fix'
    };

    // Create block data (EXACT same structure as pod.routes.js)
    const blockData = {
        podToken: podTokenString,
        shipment: shipment._id.toString(),
        deliveryData
    };

    // Create blockchain block - now includes rawHashInput
    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    console.log('\n=== CREATING NEW POD TOKEN ===');
    console.log('POD Token:', podTokenString);
    console.log('Block Number:', block.blockNumber);
    console.log('Block Hash:', block.hash.substring(0, 32) + '...');
    console.log('Has rawHashInput:', !!block.rawHashInput);

    // Save to database with rawHashInput
    const newPOD = new PODToken({
        podToken: podTokenString,
        shipment: shipment._id,
        deliveryData,
        blockchainData: {
            hash: block.hash,
            previousHash: block.previousHash,
            blockNumber: block.blockNumber,
            nonce: block.nonce,
            timestamp: block.timestamp,
            rawHashInput: block.rawHashInput  // THE FIX!
        },
        isVerified: true,
        verifiedAt: new Date(),
        verificationUrl: `http://localhost:3000/verify-pod/${podTokenString}`
    });

    await newPOD.save();
    console.log('POD Token saved to database!');

    // Now verify the POD we just created
    console.log('\n=== VERIFYING THE NEW POD ===');
    const savedPOD = await PODToken.findOne({ podToken: podTokenString })
        .populate('shipment');

    console.log('rawHashInput stored?', !!savedPOD.blockchainData.rawHashInput);

    const isValid = savedPOD.verifyIntegrity();
    console.log('Verification Result:', isValid ? 'PASSED!' : 'FAILED');

    console.log('\n========================================');
    console.log('TEST RESULT:', isValid ? 'SUCCESS!' : 'FAILED');
    console.log('========================================');

    if (isValid) {
        console.log('NEW POD TOKEN:', podTokenString);
        console.log('');
        console.log('Go to POD Verification page and enter:');
        console.log(podTokenString);
        console.log('');
        console.log('It should show INTEGRITY: PASSED');
    }
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

createRealPOD().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
