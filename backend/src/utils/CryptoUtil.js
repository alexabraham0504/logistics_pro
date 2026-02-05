const crypto = require('crypto');

/**
 * Cryptographic Utilities for Blockchain Implementation
 * Provides hashing, encryption, and token generation functions
 */

class CryptoUtil {
    /**
     * Generate SHA-256 hash of data
     * @param {Object|String} data - Data to hash
     * @returns {String} - Hexadecimal hash string
     */
    static sha256(data) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Calculate Merkle root from array of hashes
     * Used for batch verification of multiple blockchain records
     * @param {Array<String>} hashes - Array of hash strings
     * @returns {String} - Merkle root hash
     */
    static merkleRoot(hashes) {
        if (!hashes || hashes.length === 0) {
            return this.sha256('');
        }

        if (hashes.length === 1) {
            return hashes[0];
        }

        const newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : hashes[i];
            const combined = this.sha256(left + right);
            newLevel.push(combined);
        }

        return this.merkleRoot(newLevel);
    }

    /**
     * Encrypt sensitive data using AES-256-CBC
     * @param {String} data - Data to encrypt
     * @param {String} key - Encryption key (optional, uses env variable)
     * @returns {String} - Encrypted data with IV prepended
     */
    static encryptSensitive(data, key = null) {
        const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
        const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend IV to encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt sensitive data
     * @param {String} encryptedData - Encrypted data with IV prepended
     * @param {String} key - Decryption key (optional, uses env variable)
     * @returns {String} - Decrypted data
     */
    static decryptSensitive(encryptedData, key = null) {
        try {
            const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
            const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();

            const parts = encryptedData.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];

            const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: Invalid key or corrupted data');
        }
    }

    /**
     * Generate unique token with prefix
     * @param {String} prefix - Token prefix (e.g., 'POD', 'BLK')
     * @returns {String} - Unique token
     */
    static generateToken(prefix = 'TKN') {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        const year = new Date().getFullYear();

        return `${prefix}-${year}-${timestamp}${random}`;
    }

    /**
     * Generate a nonce for proof-of-work style verification
     * @returns {Number} - Random nonce
     */
    static generateNonce() {
        return crypto.randomBytes(8).readUInt32BE(0);
    }

    /**
     * Verify data integrity by comparing hashes
     * @param {Object|String} data - Original data
     * @param {String} expectedHash - Expected hash value
     * @returns {Boolean} - True if hashes match
     */
    static verifyHash(data, expectedHash) {
        const actualHash = this.sha256(data);
        return actualHash === expectedHash;
    }

    /**
     * Create a timestamped hash for blockchain blocks
     * @param {Object} data - Block data
     * @param {String} previousHash - Previous block hash
     * @param {Number} timestamp - Block timestamp
     * @returns {Object} - Hash and metadata
     */
    static createBlockHash(data, previousHash, timestamp = Date.now()) {
        const blockData = {
            data,
            previousHash,
            timestamp,
            nonce: this.generateNonce()
        };

        return {
            hash: this.sha256(blockData),
            timestamp,
            nonce: blockData.nonce
        };
    }
}

module.exports = CryptoUtil;
