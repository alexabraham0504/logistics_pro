const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TODToken = require('../src/models/TODToken.model');
const Shipment = require('../src/models/Shipment.model');
const User = require('../src/models/User.model');
const BlockchainService = require('../src/services/BlockchainService');
const CryptoUtil = require('../src/utils/CryptoUtil');

async function seedTOD() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp';
        console.log('Connecting to MongoDB at:', uri.substring(0, 20) + '...');

        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Clean existing TODs
        await TODToken.deleteMany({});
        console.log('🧹 Cleared existing TOD tokens');

        // Get dependencies
        const shipments = await Shipment.find().limit(5);
        if (shipments.length === 0) {
            console.log('Warning: No shipments found. Creating dummy shipment...');
            // Create a dummy shipment if none exist, so we can verify the UI
            const dummyShipment = new Shipment({
                trackingNumber: 'SHP-MOCK-001',
                status: 'delivered',
                origin: { address: 'Mumbai' },
                destination: { address: 'Delhi' }
            });
            // We won't save it to avoid validation issues, just use its ID if possible, 
            // but `tod` needs a ref. So we better find ANY shipment or create minimal.
            // Actually, let's just fail gracefully or try really hard to find one.
        }

        const users = await User.find().limit(2);
        let senderId = new mongoose.Types.ObjectId(); // Dummy if needed
        let receiverId = new mongoose.Types.ObjectId();

        if (users.length > 0) {
            senderId = users[0]._id;
            receiverId = users[1] ? users[1]._id : users[0]._id;
        }

        const docTypes = ['bill_of_lading', 'invoice', 'packing_list', 'customs_declaration', 'origin_certificate'];

        console.log('🌱 Seeding TOD tokens...');

        let previousHash = '0';
        let blockNumber = 1;

        // Create at least 3-5 records
        const iterations = Math.max(shipments.length, 3);

        for (let i = 0; i < iterations; i++) {
            const shipmentId = shipments.length > 0 ? shipments[i % shipments.length]._id : new mongoose.Types.ObjectId();
            const shipmentTracking = shipments.length > 0 ? shipments[i % shipments.length].trackingNumber : `MOCK-${i}`;

            const docType = docTypes[i % docTypes.length];
            const todToken = CryptoUtil.generateToken('TOD');

            const documentData = {
                documentType: docType,
                documentUrl: `https://example.com/docs/${docType}_${shipmentTracking}.pdf`,
                documentHash: CryptoUtil.sha256(`Mock content for ${docType} ${i}`),
                sender: senderId,
                receiver: receiverId,
                transferDate: new Date(Date.now() - (i * 86400000)), // Backdated
                notes: `Verified transfer of ${docType.replace(/_/g, ' ')}`
            };

            const blockData = {
                todToken,
                shipment: shipmentId.toString(),
                documentData: {
                    ...documentData,
                    sender: senderId.toString(),
                    receiver: receiverId.toString()
                }
            };

            const block = await BlockchainService.createBlock(blockData, previousHash, blockNumber);

            const newTOD = new TODToken({
                todToken,
                shipment: shipmentId,
                documentData,
                blockchainData: {
                    hash: block.hash,
                    previousHash: block.previousHash,
                    blockNumber: block.blockNumber,
                    nonce: block.nonce,
                    timestamp: block.timestamp,
                    rawHashInput: block.rawHashInput
                },
                status: 'transferred',
                verifiedBy: receiverId,
                verifiedAt: new Date()
            });

            await newTOD.save();
            console.log(`   - Created TOD: ${todToken} (Block #${blockNumber})`);

            previousHash = block.hash;
            blockNumber++;
        }

        console.log('⏳ Waiting for blockchain transactions to propagate...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        console.log('✨ TOD Seeding Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedTOD();
