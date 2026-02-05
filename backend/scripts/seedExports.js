const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const User = require('../src/models/User.model');
const Export = require('../src/models/Export.model');
const ExportBlockchain = require('../src/models/ExportBlockchain.model');

// Import Blockchain Service
const BlockchainService = require('../src/services/BlockchainService');
const CryptoUtil = require('../src/utils/CryptoUtil');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Helper: Create Export Block
async function createExportBlock(exportId, eventType, eventData, previousHash, blockNumber) {
    const blockData = { export: exportId, eventType, eventData };
    const block = BlockchainService.createBlock(blockData, previousHash, blockNumber);

    await ExportBlockchain.create({
        export: exportId,
        eventType,
        eventData,
        blockchainData: {
            hash: block.hash,
            previousHash: block.previousHash,
            blockNumber: block.blockNumber,
            timestamp: block.timestamp,
            nonce: block.nonce
        }
    });

    return block;
}

const seedExports = async () => {
    await connectDB();

    try {
        console.log('🚀 Starting Export Seed...');

        // Find admin user
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            // Create fallback admin if missing
            admin = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@logistics.com',
                password: 'admin',
                role: 'admin'
            });
            console.log('Created fallback Admin user');
        }
        console.log(`👤 using admin: ${admin.email}`);

        // --- SEED EXPORTS ---
        console.log('\n📦 Seeding Export Data...');

        // Clear old Exports
        await Export.deleteMany({});
        await ExportBlockchain.deleteMany({});

        const exportScenarios = [
            { type: 'sea', status: 'in_transit', country: 'USA' },
            { type: 'air', status: 'customs_clearance', country: 'Germany' },
            { type: 'sea', status: 'preparing', country: 'Japan' },
            { type: 'land', status: 'delivered', country: 'Nepal' },
            { type: 'air', status: 'documentation_pending', country: 'UK' }
        ];

        for (const scenario of exportScenarios) {
            // Create Export Record
            const newExport = new Export({
                exportType: scenario.type,
                status: scenario.status,
                exportDetails: {
                    exporterName: 'Indian Spices Ltd',
                    importerName: `Global Importers ${scenario.country}`,
                    importerCountry: scenario.country,
                    productDescription: 'Premium Organic Spices',
                    value: 50000 + Math.random() * 100000,
                    currency: 'USD',
                },
                createdBy: admin._id,
                blockchainMetadata: { totalBlocks: 0 }
            });

            // Genesis Block
            let prevHash = '0';
            let blkNum = 1;

            const genesisBlock = await createExportBlock(newExport._id, 'export_created', {
                exportId: newExport.exportId,
                details: newExport.exportDetails
            }, prevHash, blkNum++);

            prevHash = genesisBlock.hash;

            // Document Upload Block
            const docBlock = await createExportBlock(newExport._id, 'document_upload', {
                documentType: 'commercial_invoice',
                hash: CryptoUtil.sha256('dummy-invoice-content')
            }, prevHash, blkNum++);

            newExport.documents.push({
                documentType: 'commercial_invoice',
                documentUrl: 'https://example.com/invoice.pdf',
                documentHash: docBlock.eventData.hash,
                isVerified: true,
                blockchainHash: docBlock.hash,
                uploadedBy: admin._id
            });
            prevHash = docBlock.hash;

            // Status Updates based on scenario
            if (scenario.status !== 'preparing') {
                const statusBlock = await createExportBlock(newExport._id, 'status_update', {
                    oldStatus: 'preparing',
                    newStatus: 'documentation_pending',
                    updatedBy: admin._id
                }, prevHash, blkNum++);
                prevHash = statusBlock.hash;
            }

            // Update Export Metadata
            newExport.blockchainMetadata = {
                initialHash: genesisBlock.hash,
                currentHash: prevHash,
                totalBlocks: blkNum - 1,
                lastUpdated: new Date()
            };

            await newExport.save();
        }
        console.log(`✅ Created ${exportScenarios.length} exports with blockchain trace`);

        console.log('\n✨ Export Seed Completed Successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seed Error:', err);
        process.exit(1);
    }
};

seedExports();
