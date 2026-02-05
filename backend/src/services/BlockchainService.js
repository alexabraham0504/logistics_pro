const CryptoUtil = require('../utils/CryptoUtil');
const SmartContractService = require('./SmartContractService');

/**
 * Blockchain Service
 * Provides blockchain functionality using cryptographic hashing
 * Creates tamper-proof, verifiable records without full blockchain network
 */

class BlockchainService {
    /**
     * Create a new blockchain block
     * @param {Object} data - Block data
     * @param {String} previousHash - Hash of previous block
     * @param {Number} blockNumber - Sequential block number
     * @returns {Object} - Complete block object
     */

    static async createBlock(data, previousHash = '0', blockNumber = 1) {
        const timestamp = Date.now();
        const nonce = CryptoUtil.generateNonce();

        const blockData = {
            blockNumber,
            timestamp,
            data,
            previousHash,
            nonce
        };

        // Store the exact JSON string that was hashed for reliable verification
        const rawHashInput = JSON.stringify(blockData);
        const hash = CryptoUtil.sha256(rawHashInput);

        // HYBRID CHAIN: Publish hash to real Smart Contract in background
        // We detect the type of record based on data content
        let recordType = 'GENERIC';
        let recordId = `BLK-${blockNumber}`;

        if (data.todToken) {
            recordType = 'TOD';
            recordId = data.todToken;
        } else if (data.podToken) {
            recordType = 'POD';
            recordId = data.podToken;
        } else if (data.vahakDetails) {
            recordType = 'VAHAK';
            recordId = data.vehicleNumber || `VAHAK-${blockNumber}`;
        }

        let transactionHash = null;
        try {
            transactionHash = await SmartContractService.publishRecord(recordId, recordType, hash);
            console.log(`[Hybrid] Published ${recordId} to chain. Tx: ${transactionHash}`);
        } catch (err) {
            console.error(`[Hybrid] Failed to publish ${recordId}:`, err.message);
        }

        return {
            blockNumber,
            timestamp: new Date(timestamp),
            data,
            previousHash,
            hash,
            nonce,
            rawHashInput,  // Include for storage - ensures verification works after MongoDB roundtrip
            transactionHash
        };
    }

    /**
     * Verify a single block's integrity
     * @param {Object} block - Block to verify
     * @returns {Boolean} - True if block is valid
     */
    static verifyBlock(block) {
        if (!block || !block.hash || !block.previousHash) {
            return false;
        }

        // Recreate the block data used for hashing
        const blockData = {
            blockNumber: block.blockNumber,
            timestamp: new Date(block.timestamp).getTime(),
            data: block.data,
            previousHash: block.previousHash,
            nonce: block.nonce
        };

        const calculatedHash = CryptoUtil.sha256(blockData);
        return calculatedHash === block.hash;
    }

    /**
     * Verify chain integrity
     * @param {Array} blocks - Array of blocks in order
     * @returns {Object} - Validation result with details
     */
    static verifyChain(blocks) {
        if (!blocks || blocks.length === 0) {
            return { isValid: true, message: 'Empty chain' };
        }

        for (let i = 0; i < blocks.length; i++) {
            const currentBlock = blocks[i];

            // Verify block integrity
            if (!this.verifyBlock(currentBlock)) {
                return {
                    isValid: false,
                    message: `Block ${currentBlock.blockNumber} has been tampered with`,
                    blockNumber: currentBlock.blockNumber
                };
            }

            // Verify chain linkage (except for genesis block)
            if (i > 0) {
                const previousBlock = blocks[i - 1];
                if (currentBlock.previousHash !== previousBlock.hash) {
                    return {
                        isValid: false,
                        message: `Block ${currentBlock.blockNumber} has invalid previous hash`,
                        blockNumber: currentBlock.blockNumber,
                        expectedHash: previousBlock.hash,
                        actualHash: currentBlock.previousHash
                    };
                }
            }
        }

        return {
            isValid: true,
            message: 'Chain is valid',
            totalBlocks: blocks.length
        };
    }

    /**
     * Create genesis block (first block in chain)
     * @param {Object} data - Genesis block data
     * @returns {Object} - Genesis block
     */
    static createGenesisBlock(data) {
        return this.createBlock(
            data,
            '0000000000000000000000000000000000000000000000000000000000000000',
            0
        );
    }

    /**
     * Generate proof of existence for data
     * @param {Object} data - Data to prove existence of
     * @returns {Object} - Proof object with hash and timestamp
     */
    static generateProof(data) {
        const timestamp = Date.now();
        const hash = CryptoUtil.sha256({ data, timestamp });

        return {
            hash,
            timestamp: new Date(timestamp),
            dataHash: CryptoUtil.sha256(data)
        };
    }

    /**
     * Verify proof of existence
     * @param {Object} data - Original data
     * @param {Object} proof - Proof object
     * @returns {Boolean} - True if proof is valid
     */
    static verifyProof(data, proof) {
        if (!proof || !proof.hash || !proof.timestamp || !proof.dataHash) {
            return false;
        }

        const dataHash = CryptoUtil.sha256(data);
        if (dataHash !== proof.dataHash) {
            return false;
        }

        const timestamp = new Date(proof.timestamp).getTime();
        const expectedHash = CryptoUtil.sha256({ data, timestamp });

        return expectedHash === proof.hash;
    }

    /**
     * Create Merkle proof for data in a set
     * @param {Array} dataSet - Array of data items
     * @param {Number} index - Index of item to prove
     * @returns {Object} - Merkle proof
     */
    static createMerkleProof(dataSet, index) {
        if (!dataSet || index >= dataSet.length) {
            return null;
        }

        const hashes = dataSet.map(item => CryptoUtil.sha256(item));
        const merkleRoot = CryptoUtil.merkleRoot(hashes);

        return {
            merkleRoot,
            index,
            itemHash: hashes[index],
            totalItems: dataSet.length
        };
    }

    /**
     * Get blockchain statistics
     * @param {Array} blocks - Array of blocks
     * @returns {Object} - Statistics object
     */
    static getChainStatistics(blocks) {
        if (!blocks || blocks.length === 0) {
            return {
                totalBlocks: 0,
                firstBlock: null,
                lastBlock: null,
                totalTimespan: 0
            };
        }

        const firstBlock = blocks[0];
        const lastBlock = blocks[blocks.length - 1];
        const totalTimespan = new Date(lastBlock.timestamp) - new Date(firstBlock.timestamp);

        return {
            totalBlocks: blocks.length,
            firstBlock: {
                number: firstBlock.blockNumber,
                timestamp: firstBlock.timestamp,
                hash: firstBlock.hash
            },
            lastBlock: {
                number: lastBlock.blockNumber,
                timestamp: lastBlock.timestamp,
                hash: lastBlock.hash
            },
            totalTimespan,
            averageBlockTime: blocks.length > 1 ? totalTimespan / (blocks.length - 1) : 0
        };
    }
}

module.exports = BlockchainService;
