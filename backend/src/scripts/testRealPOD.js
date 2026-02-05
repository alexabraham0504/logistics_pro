/**
 * Test Real POD Generation with Blockchain
 * This script demonstrates the REAL blockchain flow in your project
 * 
 * Run: node src/scripts/testRealPOD.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const Shipment = require('../models/Shipment.model');
const PODToken = require('../models/PODToken.model');
const User = require('../models/User.model');
const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '═'.repeat(65));
    log(`  ${title}`, 'bright');
    console.log('═'.repeat(65));
}

async function testRealPOD() {
    console.clear();
    logSection('🚀 REAL POD BLOCKCHAIN TEST - Your Logistics ERP');

    try {
        // Connect to your actual MongoDB
        log('\n📡 Connecting to MongoDB...', 'cyan');
        await mongoose.connect(process.env.MONGODB_URI);
        log('✅ Connected to MongoDB!', 'green');

        // Step 1: Check existing blockchain state
        logSection('STEP 1: Current Blockchain State');

        const existingPODs = await PODToken.countDocuments();
        const lastPOD = await PODToken.findOne().sort({ 'blockchainData.blockNumber': -1 });

        log(`\n📊 Total POD Blocks in Chain: ${existingPODs}`, 'yellow');
        if (lastPOD) {
            log(`📦 Last Block Number: #${lastPOD.blockchainData.blockNumber}`, 'yellow');
            log(`🔐 Last Block Hash: ${lastPOD.blockchainData.hash.substring(0, 40)}...`, 'yellow');
        } else {
            log('📦 No existing blocks - this will create the GENESIS block!', 'magenta');
        }

        // Step 2: Find a shipment (or create test shipment)
        logSection('STEP 2: Finding a Shipment');

        let shipment = await Shipment.findOne({
            status: { $in: ['in_transit', 'out_for_delivery', 'pending'] }
        });

        if (!shipment) {
            log('\n⚠️  No pending shipment found. Creating a test shipment...', 'yellow');

            // Find a user for the shipment
            let user = await User.findOne({ role: 'admin' });
            if (!user) {
                user = await User.findOne();
            }

            shipment = new Shipment({
                trackingNumber: `TRK-${Date.now().toString(36).toUpperCase()}`,
                shipper: {
                    name: 'Test Sender',
                    address: '123 Test Street',
                    city: 'Mumbai',
                    phone: '9876543210'
                },
                receiver: {
                    name: 'John Doe - Test Receiver',
                    address: '456 Delivery Lane',
                    city: 'Delhi',
                    phone: '9876543211'
                },
                origin: {
                    address: '123 Test Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    country: 'India',
                    postalCode: '400001'
                },
                destination: {
                    address: '456 Delivery Lane',
                    city: 'Delhi',
                    state: 'Delhi',
                    country: 'India',
                    postalCode: '110001'
                },
                status: 'out_for_delivery',
                createdBy: user?._id,
                estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            await shipment.save();
            log(`✅ Created test shipment: ${shipment.trackingNumber}`, 'green');
        } else {
            log(`\n✅ Found shipment: ${shipment.trackingNumber}`, 'green');
        }

        log(`   Status: ${shipment.status}`, 'yellow');
        log(`   Receiver: ${shipment.receiver?.name || 'N/A'}`, 'yellow');

        // Check if POD already exists
        const existingPOD = await PODToken.findOne({ shipment: shipment._id });
        if (existingPOD) {
            log(`\n⚠️  POD already exists for this shipment: ${existingPOD.podToken}`, 'yellow');
            log('   Showing existing blockchain data...', 'yellow');

            logSection('EXISTING POD BLOCKCHAIN DATA');
            console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ ${colors.cyan}POD TOKEN: ${existingPOD.podToken}${colors.reset}                              │
├─────────────────────────────────────────────────────────────────┤
│ 📦 Block Number:    #${existingPOD.blockchainData.blockNumber}                                       │
│ 🔐 Hash:            ${existingPOD.blockchainData.hash.substring(0, 32)}...  │
│ ⛓️  Previous Hash:   ${existingPOD.blockchainData.previousHash.substring(0, 32)}...  │
│ ⏰ Timestamp:       ${new Date(existingPOD.blockchainData.timestamp).toISOString()}     │
│ 🔢 Nonce:           ${existingPOD.blockchainData.nonce}                               │
├─────────────────────────────────────────────────────────────────┤
│ 👤 Receiver:        ${existingPOD.deliveryData?.receiverName || 'N/A'}                              │
│ ✅ Verified:        ${existingPOD.isVerified ? 'YES' : 'NO'}                                        │
└─────────────────────────────────────────────────────────────────┘`);

            // Verify integrity
            logSection('STEP 3: Verify Block Integrity');
            const isValid = existingPOD.verifyIntegrity();
            log(`\n🔍 Recalculating hash from stored data...`, 'cyan');
            log(`   Stored Hash:      ${existingPOD.blockchainData.hash.substring(0, 32)}...`, 'yellow');

            if (isValid) {
                log(`\n✅ INTEGRITY CHECK: PASSED`, 'green');
                log(`   Data has NOT been tampered with!`, 'green');
            } else {
                log(`\n❌ INTEGRITY CHECK: FAILED`, 'red');
                log(`   Data may have been TAMPERED!`, 'red');
            }

            await mongoose.disconnect();
            return;
        }

        // Step 3: Generate NEW POD Token with Blockchain
        logSection('STEP 3: Generating NEW POD Token');

        log('\n📝 Preparing delivery data...', 'cyan');

        const previousHash = lastPOD ? lastPOD.blockchainData.hash : '0';
        const blockNumber = lastPOD ? lastPOD.blockchainData.blockNumber + 1 : 1;
        const podToken = CryptoUtil.generateToken('POD');

        const deliveryData = {
            timestamp: new Date(),
            location: {
                lat: 28.6139,
                lng: 77.2090,
                address: 'Delhi, India'
            },
            receiverName: shipment.receiver?.name || 'Test Receiver',
            receiverSignature: 'base64_signature_data_here',
            verificationMethod: 'signature'
        };

        log('\n🔗 Creating blockchain block...', 'cyan');

        const blockData = {
            podToken,
            shipment: shipment._id,
            deliveryData
        };

        const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

        // Show the LIVE blockchain creation
        console.log('\n' + '═'.repeat(65));
        log('  🔗 BLOCKCHAIN: NEW POD BLOCK CREATED', 'bright');
        console.log('═'.repeat(65));
        console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ ${colors.green}✅ NEW BLOCK CREATED SUCCESSFULLY${colors.reset}                              │
├─────────────────────────────────────────────────────────────────┤
│ 📦 Block Number:    #${block.blockNumber}                                          │
│ 📝 POD Token:       ${podToken}                     │
│ 👤 Receiver:        ${deliveryData.receiverName.substring(0, 30)}                    │
├─────────────────────────────────────────────────────────────────┤
│ 🔐 NEW Hash:                                                    │
│    ${block.hash}  │
├─────────────────────────────────────────────────────────────────┤
│ ⛓️  Previous Hash:                                               │
│    ${previousHash === '0' ? '0 (GENESIS BLOCK)                                              ' : previousHash}  │
├─────────────────────────────────────────────────────────────────┤
│ ⏰ Timestamp:       ${new Date(block.timestamp).toISOString()}              │
│ 🔢 Nonce:           ${block.nonce}                                      │
└─────────────────────────────────────────────────────────────────┘`);

        // Step 4: Save to MongoDB
        logSection('STEP 4: Saving to MongoDB');

        const newPOD = new PODToken({
            podToken,
            shipment: shipment._id,
            deliveryData,
            blockchainData: {
                hash: block.hash,
                previousHash: block.previousHash,
                blockNumber: block.blockNumber,
                nonce: block.nonce,
                timestamp: block.timestamp
            },
            isVerified: true,
            verificationUrl: `http://localhost:3000/verify-pod/${podToken}`
        });

        await newPOD.save();
        log('\n✅ POD Token saved to MongoDB!', 'green');

        // Update shipment
        shipment.status = 'delivered';
        shipment.actualDelivery = new Date();
        shipment.proofOfDelivery = {
            podToken,
            blockchainHash: block.hash,
            previousHash: block.previousHash,
            blockNumber: block.blockNumber,
            receiverName: deliveryData.receiverName,
            deliveryTime: new Date()
        };
        await shipment.save();
        log('✅ Shipment updated to DELIVERED!', 'green');

        // Step 5: Verify the chain
        logSection('STEP 5: Verify Chain Integrity');

        const allPODs = await PODToken.find()
            .sort({ 'blockchainData.blockNumber': 1 })
            .lean();

        const blocks = allPODs.map(p => ({
            blockNumber: p.blockchainData.blockNumber,
            timestamp: p.blockchainData.timestamp,
            data: { podToken: p.podToken, deliveryData: p.deliveryData },
            previousHash: p.blockchainData.previousHash,
            hash: p.blockchainData.hash,
            nonce: p.blockchainData.nonce
        }));

        log(`\n🔍 Verifying ${blocks.length} blocks in chain...`, 'cyan');

        const chainResult = BlockchainService.verifyChain(blocks);

        console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                    CHAIN VERIFICATION RESULT                    │
├─────────────────────────────────────────────────────────────────┤
│  Total Blocks:     ${blocks.length}                                            │
│  Status:           ${chainResult.isValid ? colors.green + '✅ VALID' + colors.reset + '                                    ' : colors.red + '❌ COMPROMISED' + colors.reset + '                             '}│
│  Message:          ${chainResult.message.substring(0, 40)}     │
└─────────────────────────────────────────────────────────────────┘`);

        // Final summary
        logSection('📊 TEST COMPLETE');

        console.log(`
${colors.green}✅ Successfully demonstrated:${colors.reset}
   • Found/created shipment: ${shipment.trackingNumber}
   • Generated POD token: ${podToken}
   • Created blockchain block #${block.blockNumber}
   • Linked to previous hash
   • Saved to MongoDB
   • Verified chain integrity

${colors.cyan}🔗 Verify this POD:${colors.reset}
   curl http://localhost:5000/api/pod/verify/${podToken}

${colors.yellow}📱 Or scan QR code at:${colors.reset}
   ${newPOD.verificationUrl}
`);

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await mongoose.disconnect();
        log('\n📡 Disconnected from MongoDB', 'cyan');
    }
}

// Run the test
testRealPOD();
