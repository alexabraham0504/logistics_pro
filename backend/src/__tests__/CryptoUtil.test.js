/**
 * CryptoUtil Tests
 * Comprehensive tests for cryptographic utility functions
 */

const CryptoUtil = require('../utils/CryptoUtil');

describe('CryptoUtil', () => {
    describe('sha256', () => {
        test('should generate consistent hash for same input', () => {
            const data = { name: 'test', value: 123 };
            const hash1 = CryptoUtil.sha256(data);
            const hash2 = CryptoUtil.sha256(data);
            expect(hash1).toBe(hash2);
        });

        test('should generate 64-character hex hash', () => {
            const hash = CryptoUtil.sha256('test data');
            expect(hash).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
        });

        test('should generate different hashes for different inputs', () => {
            const hash1 = CryptoUtil.sha256('data1');
            const hash2 = CryptoUtil.sha256('data2');
            expect(hash1).not.toBe(hash2);
        });

        test('should handle string input', () => {
            const hash = CryptoUtil.sha256('simple string');
            expect(hash).toHaveLength(64);
        });

        test('should handle object input', () => {
            const hash = CryptoUtil.sha256({ key: 'value' });
            expect(hash).toHaveLength(64);
        });

        test('should handle nested objects', () => {
            const hash = CryptoUtil.sha256({
                level1: { level2: { level3: 'deep' } }
            });
            expect(hash).toHaveLength(64);
        });
    });

    describe('merkleRoot', () => {
        test('should return hash of empty string for empty array', () => {
            const root = CryptoUtil.merkleRoot([]);
            expect(root).toHaveLength(64);
        });

        test('should return same hash for single element', () => {
            const hash = 'abc123';
            const root = CryptoUtil.merkleRoot([hash]);
            expect(root).toBe(hash);
        });

        test('should compute merkle root for multiple hashes', () => {
            const hashes = [
                CryptoUtil.sha256('data1'),
                CryptoUtil.sha256('data2'),
                CryptoUtil.sha256('data3'),
                CryptoUtil.sha256('data4')
            ];
            const root = CryptoUtil.merkleRoot(hashes);
            expect(root).toHaveLength(64);
        });

        test('should produce consistent merkle root', () => {
            const hashes = ['hash1', 'hash2', 'hash3'];
            const root1 = CryptoUtil.merkleRoot(hashes);
            const root2 = CryptoUtil.merkleRoot(hashes);
            expect(root1).toBe(root2);
        });

        test('should handle odd number of hashes', () => {
            const hashes = ['hash1', 'hash2', 'hash3'];
            const root = CryptoUtil.merkleRoot(hashes);
            expect(root).toHaveLength(64);
        });
    });

    describe('encryptSensitive / decryptSensitive', () => {
        const testKey = 'test-encryption-key-12345';

        test('should encrypt and decrypt data correctly', () => {
            const originalData = 'Sensitive data 123';
            const encrypted = CryptoUtil.encryptSensitive(originalData, testKey);
            const decrypted = CryptoUtil.decryptSensitive(encrypted, testKey);
            expect(decrypted).toBe(originalData);
        });

        test('should produce different ciphertext for same plaintext (due to IV)', () => {
            const data = 'Same data';
            const encrypted1 = CryptoUtil.encryptSensitive(data, testKey);
            const encrypted2 = CryptoUtil.encryptSensitive(data, testKey);
            expect(encrypted1).not.toBe(encrypted2);
        });

        test('should contain IV separator in encrypted output', () => {
            const encrypted = CryptoUtil.encryptSensitive('data', testKey);
            expect(encrypted).toContain(':');
        });

        test('should throw error for wrong key', () => {
            const encrypted = CryptoUtil.encryptSensitive('data', testKey);
            expect(() => {
                CryptoUtil.decryptSensitive(encrypted, 'wrong-key');
            }).toThrow();
        });
    });

    describe('generateToken', () => {
        test('should generate token with correct prefix', () => {
            const token = CryptoUtil.generateToken('POD');
            expect(token.startsWith('POD-')).toBe(true);
        });

        test('should include current year in token', () => {
            const year = new Date().getFullYear();
            const token = CryptoUtil.generateToken('TEST');
            expect(token).toContain(year.toString());
        });

        test('should generate unique tokens', () => {
            const token1 = CryptoUtil.generateToken('TKN');
            const token2 = CryptoUtil.generateToken('TKN');
            expect(token1).not.toBe(token2);
        });

        test('should use default prefix if not provided', () => {
            const token = CryptoUtil.generateToken();
            expect(token.startsWith('TKN-')).toBe(true);
        });
    });

    describe('generateNonce', () => {
        test('should generate positive integer', () => {
            const nonce = CryptoUtil.generateNonce();
            expect(Number.isInteger(nonce)).toBe(true);
            expect(nonce).toBeGreaterThanOrEqual(0);
        });

        test('should generate different nonces', () => {
            const nonces = new Set();
            for (let i = 0; i < 100; i++) {
                nonces.add(CryptoUtil.generateNonce());
            }
            // Expect at least 90% unique values
            expect(nonces.size).toBeGreaterThan(90);
        });
    });

    describe('verifyHash', () => {
        test('should return true for matching hash', () => {
            const data = { test: 'data' };
            const hash = CryptoUtil.sha256(data);
            expect(CryptoUtil.verifyHash(data, hash)).toBe(true);
        });

        test('should return false for non-matching hash', () => {
            const data = { test: 'data' };
            expect(CryptoUtil.verifyHash(data, 'invalid-hash')).toBe(false);
        });

        test('should detect data tampering', () => {
            const originalData = { amount: 100 };
            const hash = CryptoUtil.sha256(originalData);
            const tamperedData = { amount: 200 };
            expect(CryptoUtil.verifyHash(tamperedData, hash)).toBe(false);
        });
    });

    describe('createBlockHash', () => {
        test('should create hash with timestamp and nonce', () => {
            const result = CryptoUtil.createBlockHash({ data: 'test' }, 'prev-hash');
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('nonce');
        });

        test('should use provided timestamp', () => {
            const customTimestamp = 1234567890000;
            const result = CryptoUtil.createBlockHash({ data: 'test' }, 'prev', customTimestamp);
            expect(result.timestamp).toBe(customTimestamp);
        });

        test('should generate 64-character hash', () => {
            const result = CryptoUtil.createBlockHash({ data: 'test' }, 'prev');
            expect(result.hash).toHaveLength(64);
        });
    });
});
