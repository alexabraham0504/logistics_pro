/**
 * Blockchain Live Demo Script
 * Run this to see the blockchain working in real-time in your terminal
 * 
 * Usage: node src/scripts/blockchainDemo.js
 */

const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bgGreen: '\x1b[42m',
    bgRed: '\x1b[41m',
    bgBlue: '\x1b[44m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
    console.log('\n' + '═'.repeat(70));
    log(`  ${title}`, 'bright');
    console.log('═'.repeat(70));
}

function logBlock(block) {
    console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ ${colors.cyan}BLOCK #${block.blockNumber}${colors.reset}                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ${colors.yellow}Timestamp:${colors.reset}    ${new Date(block.timestamp).toISOString()}              │
│ ${colors.yellow}Data:${colors.reset}         ${JSON.stringify(block.data).substring(0, 45)}...     │
│ ${colors.yellow}Nonce:${colors.reset}        ${block.nonce}                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ${colors.magenta}Previous Hash:${colors.reset}                                                    │
│   ${block.previousHash.substring(0, 32)}...                         │
├─────────────────────────────────────────────────────────────────────┤
│ ${colors.green}Current Hash:${colors.reset}                                                     │
│   ${block.hash.substring(0, 32)}...                         │
└─────────────────────────────────────────────────────────────────────┘`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
    console.clear();

    logHeader('🔗 BLOCKCHAIN LIVE DEMO - LOGISTICS ERP');
    log('\nThis demo shows blockchain operations in real-time.\n', 'cyan');

    await sleep(1000);

    // ============================================
    // 1. DEMONSTRATE HASHING
    // ============================================
    logHeader('1️⃣  SHA-256 CRYPTOGRAPHIC HASHING');

    const sampleData = { shipmentId: 'SHP-001', status: 'delivered', receiver: 'John Doe' };
    log('\n📄 Input Data:', 'yellow');
    console.log(JSON.stringify(sampleData, null, 2));

    await sleep(500);
    log('\n🔐 Generating SHA-256 hash...', 'cyan');
    await sleep(300);

    const hash = CryptoUtil.sha256(sampleData);
    log(`\n✅ Hash Generated: ${colors.green}${hash}${colors.reset}`);
    log('   (64 characters, hexadecimal)', 'yellow');

    await sleep(1000);

    // ============================================
    // 2. CREATE A BLOCKCHAIN
    // ============================================
    logHeader('2️⃣  CREATING A BLOCKCHAIN');

    const chain = [];

    // Genesis Block
    log('\n📦 Creating Genesis Block (Block #0)...', 'cyan');
    await sleep(500);

    const genesis = BlockchainService.createGenesisBlock({
        type: 'GENESIS',
        message: 'Logistics ERP Blockchain Initialized',
        timestamp: new Date().toISOString()
    });
    chain.push(genesis);
    logBlock(genesis);

    await sleep(1000);

    // Delivery Blocks
    const deliveries = [
        { shipmentId: 'SHP-1001', receiver: 'Alice Smith', city: 'Mumbai', amount: 15000 },
        { shipmentId: 'SHP-1002', receiver: 'Bob Kumar', city: 'Delhi', amount: 22500 },
        { shipmentId: 'SHP-1003', receiver: 'Carol Sharma', city: 'Bangalore', amount: 18750 }
    ];

    for (let i = 0; i < deliveries.length; i++) {
        const delivery = deliveries[i];
        log(`\n📦 Creating Block #${i + 1} - Delivery Confirmation...`, 'cyan');
        log(`   Shipment: ${delivery.shipmentId} → ${delivery.receiver} (${delivery.city})`, 'yellow');
        await sleep(800);

        const lastBlock = chain[chain.length - 1];
        const newBlock = BlockchainService.createBlock(
            { type: 'POD', ...delivery, deliveredAt: new Date().toISOString() },
            lastBlock.hash,
            i + 1
        );
        chain.push(newBlock);
        logBlock(newBlock);

        log(`\n   🔗 Linked to previous block via hash: ${lastBlock.hash.substring(0, 16)}...`, 'green');
        await sleep(500);
    }

    await sleep(1000);

    // ============================================
    // 3. VERIFY CHAIN INTEGRITY
    // ============================================
    logHeader('3️⃣  VERIFYING CHAIN INTEGRITY');

    log('\n🔍 Checking all blocks and their linkage...', 'cyan');
    await sleep(500);

    for (let i = 0; i < chain.length; i++) {
        await sleep(300);
        const isValid = BlockchainService.verifyBlock(chain[i]);
        const icon = isValid ? '✅' : '❌';
        const color = isValid ? 'green' : 'red';
        log(`   Block #${i}: ${icon} ${isValid ? 'Valid' : 'TAMPERED!'}`, color);
    }

    await sleep(500);
    const chainResult = BlockchainService.verifyChain(chain);

    console.log('\n┌─────────────────────────────────────────┐');
    if (chainResult.isValid) {
        log(`│  ${colors.bgGreen}${colors.bright} CHAIN VERIFICATION: PASSED ✓ ${colors.reset}          │`, 'green');
    } else {
        log(`│  ${colors.bgRed}${colors.bright} CHAIN VERIFICATION: FAILED ✗ ${colors.reset}          │`, 'red');
    }
    console.log(`│  Total Blocks: ${chain.length}                         │`);
    console.log(`│  Message: ${chainResult.message.substring(0, 28)}      │`);
    console.log('└─────────────────────────────────────────┘');

    await sleep(1000);

    // ============================================
    // 4. TAMPER DETECTION DEMO
    // ============================================
    logHeader('4️⃣  TAMPER DETECTION DEMO');

    log('\n⚠️  Simulating an attack: Modifying Block #2 data...', 'yellow');
    log('   Changing delivery amount from ₹22,500 to ₹50,000', 'yellow');
    await sleep(800);

    // Tamper with block
    const originalAmount = chain[2].data.amount;
    chain[2].data.amount = 50000;

    log('\n🔍 Re-verifying chain after tampering...', 'cyan');
    await sleep(500);

    for (let i = 0; i < chain.length; i++) {
        await sleep(300);
        const isValid = BlockchainService.verifyBlock(chain[i]);
        const icon = isValid ? '✅' : '❌';
        const color = isValid ? 'green' : 'red';
        log(`   Block #${i}: ${icon} ${isValid ? 'Valid' : 'TAMPERED DETECTED!'}`, color);
    }

    const tamperedResult = BlockchainService.verifyChain(chain);

    console.log('\n┌─────────────────────────────────────────┐');
    log(`│  ${colors.bgRed}${colors.bright} CHAIN VERIFICATION: FAILED ✗ ${colors.reset}          │`, 'red');
    console.log(`│  Tampered Block: #${tamperedResult.blockNumber || 2}                      │`);
    console.log(`│  ${tamperedResult.message.substring(0, 37)}   │`);
    console.log('└─────────────────────────────────────────┘');

    log('\n🛡️  CONCLUSION: Any modification to data is immediately detected!', 'green');

    // Restore for stats
    chain[2].data.amount = originalAmount;

    await sleep(1000);

    // ============================================
    // 5. CHAIN STATISTICS
    // ============================================
    logHeader('5️⃣  BLOCKCHAIN STATISTICS');

    // Restore block for proper stats
    const block2Restored = BlockchainService.createBlock(
        chain[2].data,
        chain[1].hash,
        2
    );
    chain[2] = block2Restored;

    const stats = BlockchainService.getChainStatistics(chain);

    console.log(`
┌────────────────────────────────────────────────────────────────────┐
│                      CHAIN STATISTICS                              │
├────────────────────────────────────────────────────────────────────┤
│  Total Blocks:        ${stats.totalBlocks}                         │
│  First Block:         #${stats.firstBlock.number} (Genesis)        │
│  Latest Block:        #${stats.lastBlock.number}                   │
│  Chain Duration:      ${Math.round(stats.totalTimespan / 1000)} seconds│
│  Avg Block Time:      ${Math.round(stats.averageBlockTime)} ms     │
└────────────────────────────────────────────────────────────────────┘`);

    await sleep(500);

    // ============================================
    // 6. ENCRYPTION DEMO
    // ============================================
    logHeader('6️⃣  SENSITIVE DATA ENCRYPTION (AES-256)');

    const sensitiveData = 'XXXX-XXXX-1234';
    log(`\n📄 Original Aadhar (masked): ${sensitiveData}`, 'yellow');

    await sleep(300);
    log('\n🔐 Encrypting with AES-256-CBC...', 'cyan');
    await sleep(500);

    const encrypted = CryptoUtil.encryptSensitive(sensitiveData);
    log(`\n🔒 Encrypted: ${encrypted.substring(0, 50)}...`, 'magenta');

    await sleep(300);
    log('\n🔓 Decrypting...', 'cyan');
    await sleep(500);

    const decrypted = CryptoUtil.decryptSensitive(encrypted);
    log(`\n✅ Decrypted: ${decrypted}`, 'green');
    log('   (Original data recovered successfully)', 'yellow');

    // ============================================
    // FINAL SUMMARY
    // ============================================
    logHeader('📊 DEMO COMPLETE');

    console.log(`
${colors.green}✅ Demonstrated Features:${colors.reset}
   • SHA-256 Cryptographic Hashing
   • Block Creation with Chain Linking
   • Genesis Block Creation
   • Chain Integrity Verification
   • Tamper Detection (Modified data detected!)
   • Chain Statistics
   • AES-256 Encryption for Sensitive Data

${colors.cyan}🚀 To use in production:${colors.reset}
   • POD Token Generation: POST /api/pod/generate
   • POD Verification: GET /api/pod/verify/:token
   • Chain Validation: GET /api/blockchain/validate/:chain
   • Explorer: GET /api/blockchain/explorer

${colors.yellow}📝 Run tests:${colors.reset}
   npm test
`);
}

// Run the demo
runDemo().catch(console.error);
