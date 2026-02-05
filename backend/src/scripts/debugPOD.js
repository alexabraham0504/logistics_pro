/**
 * Debug POD hashing to find the discrepancy
 */
const mongoose = require('mongoose');
require('dotenv').config();

const PODToken = require('../models/PODToken.model');
const Shipment = require('../models/Shipment.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

async function debugPOD() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the POD we created
    const pod = await PODToken.findOne({ podToken: 'POD-2026-ML52EYAI4374988F' });

    if (!pod) {
        console.log('POD not found');
        await mongoose.disconnect();
        return;
    }

    console.log('=== WHAT WAS HASHED DURING CREATION ===');
    // This is what BlockchainService.createBlock does:
    // 1. Takes blockData = { podToken, shipment, deliveryData }
    // 2. Creates hashInput = { blockNumber, timestamp, data: blockData, previousHash, nonce }
    // 3. Hashes hashInput

    // The issue: blockchainData.timestamp is when the BLOCK was created
    // But deliveryData.timestamp is when the delivery happened
    // These are stored separately

    console.log('Block timestamp:', pod.blockchainData.timestamp);
    console.log('Block timestamp as getTime():', new Date(pod.blockchainData.timestamp).getTime());
    console.log('Block number:', pod.blockchainData.blockNumber);
    console.log('Previous hash:', pod.blockchainData.previousHash);
    console.log('Nonce:', pod.blockchainData.nonce);
    console.log('Stored hash:', pod.blockchainData.hash);

    console.log('\n=== RECREATING THE VERIFICATION DATA ===');

    // Get shipment ID
    let shipmentId;
    if (pod.shipment && typeof pod.shipment === 'object' && pod.shipment._id) {
        shipmentId = pod.shipment._id.toString();
    } else if (pod.shipment) {
        shipmentId = pod.shipment.toString();
    }
    console.log('Shipment ID:', shipmentId);

    // Get deliveryData
    const deliveryDataPlain = pod.deliveryData.toObject
        ? pod.deliveryData.toObject()
        : pod.deliveryData;
    console.log('DeliveryData:', JSON.stringify(deliveryDataPlain, null, 2));

    // Recreate what should have been hashed
    const dataSection = {
        podToken: pod.podToken,
        shipment: shipmentId,
        deliveryData: deliveryDataPlain
    };

    const blockData = {
        blockNumber: pod.blockchainData.blockNumber,
        timestamp: new Date(pod.blockchainData.timestamp).getTime(),
        data: dataSection,
        previousHash: pod.blockchainData.previousHash,
        nonce: pod.blockchainData.nonce
    };

    console.log('\n=== BLOCK DATA FOR HASHING ===');
    console.log(JSON.stringify(blockData, null, 2));

    const calculatedHash = CryptoUtil.sha256(blockData);
    console.log('\n=== RESULT ===');
    console.log('Stored hash:    ', pod.blockchainData.hash);
    console.log('Calculated hash:', calculatedHash);
    console.log('Match:', calculatedHash === pod.blockchainData.hash);

    await mongoose.disconnect();
}

debugPOD().catch(console.error);
