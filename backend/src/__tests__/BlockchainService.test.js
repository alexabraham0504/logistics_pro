/**
 * BlockchainService Tests
 * Tests for blockchain block creation, verification, and chain integrity
 */

const BlockchainService = require('../services/BlockchainService');
const CryptoUtil = require('../utils/CryptoUtil');

describe('BlockchainService', () => {
    describe('createBlock', () => {
        test('should create a block with all required fields', () => {
            const data = { shipmentId: '123', status: 'delivered' };
            const block = BlockchainService.createBlock(data, '0', 1);

            expect(block).toHaveProperty('blockNumber', 1);
            expect(block).toHaveProperty('timestamp');
            expect(block).toHaveProperty('data');
            expect(block).toHaveProperty('previousHash', '0');
            expect(block).toHaveProperty('hash');
            expect(block).toHaveProperty('nonce');
        });

        test('should generate valid SHA-256 hash', () => {
            const block = BlockchainService.createBlock({ test: 'data' }, '0', 1);
            expect(block.hash).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(block.hash)).toBe(true);
        });

        test('should link to previous hash correctly', () => {
            const previousHash = 'abc123def456';
            const block = BlockchainService.createBlock({ data: 'test' }, previousHash, 2);
            expect(block.previousHash).toBe(previousHash);
        });

        test('should include timestamp as Date object', () => {
            const block = BlockchainService.createBlock({ data: 'test' }, '0', 1);
            expect(block.timestamp).toBeInstanceOf(Date);
        });

        test('should increment block numbers correctly', () => {
            const block1 = BlockchainService.createBlock({ data: 'first' }, '0', 1);
            const block2 = BlockchainService.createBlock({ data: 'second' }, block1.hash, 2);
            expect(block2.blockNumber).toBe(2);
        });
    });

    describe('verifyBlock', () => {
        test('should verify a valid block', () => {
            const data = { transaction: 'payment', amount: 100 };
            const block = BlockchainService.createBlock(data, '0', 1);
            expect(BlockchainService.verifyBlock(block)).toBe(true);
        });

        test('should detect tampered data', () => {
            const block = BlockchainService.createBlock({ amount: 100 }, '0', 1);
            // Tamper with the data
            block.data.amount = 999;
            expect(BlockchainService.verifyBlock(block)).toBe(false);
        });

        test('should detect tampered hash', () => {
            const block = BlockchainService.createBlock({ data: 'test' }, '0', 1);
            // Tamper with the hash
            block.hash = 'tampered-hash-value';
            expect(BlockchainService.verifyBlock(block)).toBe(false);
        });

        test('should detect tampered previousHash', () => {
            const block = BlockchainService.createBlock({ data: 'test' }, 'original', 1);
            // Change the previous hash after creation
            block.previousHash = 'tampered';
            expect(BlockchainService.verifyBlock(block)).toBe(false);
        });

        test('should return false for null block', () => {
            expect(BlockchainService.verifyBlock(null)).toBe(false);
        });

        test('should return false for block without hash', () => {
            expect(BlockchainService.verifyBlock({ data: 'no hash' })).toBe(false);
        });

        test('should detect tampered timestamp', () => {
            const block = BlockchainService.createBlock({ data: 'test' }, '0', 1);
            // Tamper with timestamp
            block.timestamp = new Date('2020-01-01');
            expect(BlockchainService.verifyBlock(block)).toBe(false);
        });

        test('should detect tampered nonce', () => {
            const block = BlockchainService.createBlock({ data: 'test' }, '0', 1);
            // Tamper with nonce
            block.nonce = 999999;
            expect(BlockchainService.verifyBlock(block)).toBe(false);
        });
    });

    describe('verifyChain', () => {
        test('should verify a valid chain', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);
            const block3 = BlockchainService.createBlock({ tx: 3 }, block2.hash, 3);

            const result = BlockchainService.verifyChain([block1, block2, block3]);
            expect(result.isValid).toBe(true);
            expect(result.totalBlocks).toBe(3);
        });

        test('should return valid for empty chain', () => {
            const result = BlockchainService.verifyChain([]);
            expect(result.isValid).toBe(true);
            expect(result.message).toBe('Empty chain');
        });

        test('should detect broken chain linkage', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);
            const block3 = BlockchainService.createBlock({ tx: 3 }, 'wrong-hash', 3);

            const result = BlockchainService.verifyChain([block1, block2, block3]);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('invalid previous hash');
        });

        test('should detect tampered block in chain', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);

            // Tamper with block2 data
            block2.data.tx = 999;

            const result = BlockchainService.verifyChain([block1, block2]);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('tampered');
        });

        test('should identify which block was tampered', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);
            block2.data.tx = 999;

            const result = BlockchainService.verifyChain([block1, block2]);
            expect(result.blockNumber).toBe(2);
        });
    });

    describe('createGenesisBlock', () => {
        test('should create genesis block with block number 0', () => {
            const genesis = BlockchainService.createGenesisBlock({ system: 'init' });
            expect(genesis.blockNumber).toBe(0);
        });

        test('should have zero previousHash for genesis block', () => {
            const genesis = BlockchainService.createGenesisBlock({ init: true });
            expect(genesis.previousHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
        });

        test('should be verifiable', () => {
            const genesis = BlockchainService.createGenesisBlock({ data: 'genesis' });
            expect(BlockchainService.verifyBlock(genesis)).toBe(true);
        });
    });

    describe('generateProof', () => {
        test('should generate proof with hash and timestamp', () => {
            const data = { document: 'contract.pdf', hash: 'abc123' };
            const proof = BlockchainService.generateProof(data);

            expect(proof).toHaveProperty('hash');
            expect(proof).toHaveProperty('timestamp');
            expect(proof).toHaveProperty('dataHash');
        });

        test('should generate unique proofs for same data at different times', async () => {
            const data = { test: 'data' };
            const proof1 = BlockchainService.generateProof(data);

            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
            const proof2 = BlockchainService.generateProof(data);

            expect(proof1.hash).not.toBe(proof2.hash);
        });
    });

    describe('verifyProof', () => {
        test('should verify valid proof', () => {
            const data = { shipment: 'delivered' };
            const proof = BlockchainService.generateProof(data);
            expect(BlockchainService.verifyProof(data, proof)).toBe(true);
        });

        test('should reject proof for different data', () => {
            const originalData = { amount: 100 };
            const proof = BlockchainService.generateProof(originalData);

            const tamperedData = { amount: 999 };
            expect(BlockchainService.verifyProof(tamperedData, proof)).toBe(false);
        });

        test('should reject invalid proof object', () => {
            expect(BlockchainService.verifyProof({}, null)).toBe(false);
            expect(BlockchainService.verifyProof({}, {})).toBe(false);
        });
    });

    describe('createMerkleProof', () => {
        test('should create merkle proof for valid index', () => {
            const dataSet = [
                { tx: 1 },
                { tx: 2 },
                { tx: 3 },
                { tx: 4 }
            ];
            const proof = BlockchainService.createMerkleProof(dataSet, 2);

            expect(proof).toHaveProperty('merkleRoot');
            expect(proof).toHaveProperty('index', 2);
            expect(proof).toHaveProperty('itemHash');
            expect(proof).toHaveProperty('totalItems', 4);
        });

        test('should return null for invalid index', () => {
            const dataSet = [{ a: 1 }, { b: 2 }];
            const proof = BlockchainService.createMerkleProof(dataSet, 5);
            expect(proof).toBeNull();
        });

        test('should return null for empty dataset', () => {
            const proof = BlockchainService.createMerkleProof(null, 0);
            expect(proof).toBeNull();
        });
    });

    describe('getChainStatistics', () => {
        test('should return statistics for valid chain', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);

            const stats = BlockchainService.getChainStatistics([block1, block2]);

            expect(stats.totalBlocks).toBe(2);
            expect(stats.firstBlock).toHaveProperty('number', 1);
            expect(stats.lastBlock).toHaveProperty('number', 2);
            expect(stats).toHaveProperty('totalTimespan');
            expect(stats).toHaveProperty('averageBlockTime');
        });

        test('should handle empty chain', () => {
            const stats = BlockchainService.getChainStatistics([]);
            expect(stats.totalBlocks).toBe(0);
            expect(stats.firstBlock).toBeNull();
            expect(stats.lastBlock).toBeNull();
        });

        test('should calculate average block time', () => {
            const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
            const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);
            const block3 = BlockchainService.createBlock({ tx: 3 }, block2.hash, 3);

            const stats = BlockchainService.getChainStatistics([block1, block2, block3]);
            expect(typeof stats.averageBlockTime).toBe('number');
        });
    });
});

describe('Tamper Detection Scenarios', () => {
    test('SCENARIO: Attacker modifies delivery amount', () => {
        // Create a delivery record
        const deliveryBlock = BlockchainService.createBlock({
            shipmentId: 'SHIP-001',
            deliveredItems: 100,
            receiverName: 'John Doe'
        }, '0', 1);

        // Attacker tries to change delivered items
        const tamperedBlock = { ...deliveryBlock };
        tamperedBlock.data = { ...tamperedBlock.data, deliveredItems: 50 };

        // System detects tampering
        expect(BlockchainService.verifyBlock(tamperedBlock)).toBe(false);
    });

    test('SCENARIO: Attacker modifies delivery timestamp', () => {
        const block = BlockchainService.createBlock({
            event: 'delivery',
            time: '2026-01-29T10:00:00Z'
        }, '0', 1);

        // Change the block's timestamp
        block.timestamp = new Date('2026-01-28T10:00:00Z');

        expect(BlockchainService.verifyBlock(block)).toBe(false);
    });

    test('SCENARIO: Attacker tries to insert fake block in chain', () => {
        const block1 = BlockchainService.createBlock({ tx: 1 }, '0', 1);
        const block2 = BlockchainService.createBlock({ tx: 2 }, block1.hash, 2);
        const block3 = BlockchainService.createBlock({ tx: 3 }, block2.hash, 3);

        // Attacker creates a fake block with fabricated previousHash
        const fakeBlock = BlockchainService.createBlock({ tx: 'fake' }, 'fabricated-hash', 2);

        // Insert fake block
        const tamperedChain = [block1, fakeBlock, block3];

        const result = BlockchainService.verifyChain(tamperedChain);
        expect(result.isValid).toBe(false);
    });

    test('SCENARIO: Complete chain integrity after multiple transactions', () => {
        const chain = [];
        let previousHash = '0';

        // Simulate 10 transactions
        for (let i = 1; i <= 10; i++) {
            const block = BlockchainService.createBlock(
                { transactionId: i, amount: i * 100 },
                previousHash,
                i
            );
            chain.push(block);
            previousHash = block.hash;
        }

        const result = BlockchainService.verifyChain(chain);
        expect(result.isValid).toBe(true);
        expect(result.totalBlocks).toBe(10);
    });
});
