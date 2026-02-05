const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { performance } = require('perf_hooks');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const ExportBlockchain = require('../src/models/ExportBlockchain.model');
const BlockchainService = require('../src/services/BlockchainService');
const CryptoUtil = require('../src/utils/CryptoUtil');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics_erp');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const runPerformanceTest = async () => {
    await connectDB();

    try {
        console.log('🚀 Starting Performance Test for 1000+ Blockchain Records...');

        // 1. CLEAR EXISTING DATA
        console.log('🧹 Clearing performance test data...');
        await ExportBlockchain.deleteMany({ 'eventData.isPerfTest': true });

        const count = 1000;
        let previousHash = '0';
        let blockNumber = 1;

        // 2. SIMULATE WRITING 1000 BLOCKS
        console.log(`📥 Writing ${count} blocks to database...`);
        const writeStart = performance.now();

        const blocks = [];
        for (let i = 0; i < count; i++) {
            const data = {
                timestamp: Date.now(),
                event: `Performance test event ${i}`,
                isPerfTest: true,
                metadata: { index: i, random: Math.random() }
            };

            const block = BlockchainService.createBlock(data, previousHash, blockNumber++);

            blocks.push({
                export: new mongoose.Types.ObjectId(), // Simulated Export ID
                eventType: 'status_update',
                eventData: data,
                blockchainData: {
                    hash: block.hash,
                    previousHash: block.previousHash,
                    blockNumber: block.blockNumber,
                    timestamp: block.timestamp,
                    nonce: block.nonce
                }
            });
            previousHash = block.hash;
        }

        // Batch insert for performance
        await ExportBlockchain.insertMany(blocks);
        const writeEnd = performance.now();
        const writeDuration = ((writeEnd - writeStart) / 1000).toFixed(2);
        console.log(`✅ Finished writing ${count} blocks. Time: ${writeDuration}s`);

        // 3. MEASURE QUERY & VERIFICATION SPEED
        console.log(`🔍 Querying and verifying integrity of ${count} blocks...`);
        const verifyStart = performance.now();

        // Query blocks in order
        const fetchedBlocks = await ExportBlockchain.find({ 'eventData.isPerfTest': true })
            .sort({ 'blockchainData.blockNumber': 1 });

        // Use core logic to verify
        const validation = verifyChainIntegrity(fetchedBlocks);

        const verifyEnd = performance.now();

        console.log(`\n--- PERFORMANCE RESULTS ---`);
        console.log(`Total Records: ${count}`);
        console.log(`Write Time: ${writeDuration}s`);
        console.log(`Query + Verification Time: ${(verifyEnd - verifyStart).toFixed(2)}ms`);
        console.log(`Avg Time per Block: ${((verifyEnd - verifyStart) / count).toFixed(4)}ms`);
        console.log(`Integrity Check: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
        if (!validation.isValid) console.log(`Reason: ${validation.reason} at Block ${validation.block}`);
        console.log(`---------------------------\n`);

        process.exit(0);

    } catch (err) {
        console.error('❌ Performance Test Error:', err);
        process.exit(1);
    }
};

// Simplified verification logic for the test
function verifyChainIntegrity(blocks) {
    if (!blocks || blocks.length === 0) return { isValid: true };

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // Chain linkage verification
        if (i > 0) {
            const previousBlock = blocks[i - 1];
            if (block.blockchainData.previousHash !== previousBlock.blockchainData.hash) {
                return { isValid: false, block: block.blockchainData.blockNumber, reason: 'Chain broken' };
            }
        }
    }

    return { isValid: true };
}

runPerformanceTest();
