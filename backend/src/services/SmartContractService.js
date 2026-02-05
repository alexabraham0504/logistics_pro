const { ethers } = require('ethers');
require('dotenv').config();

// The deployed contract address
const CONTRACT_ADDRESS = (process.env.SMART_CONTRACT_ADDRESS || "0xB2a792Fc0d390f79D71BB85e431bC8F4c628ADba").trim();
const RPC_URL = (process.env.BLOCKCHAIN_RPC_URL || "https://rpc-amoy.polygon.technology/").trim();

// Simplified ABI of the LogisticsTracker
const CONTRACT_ABI = [
    "function verifyRecord(string _recordId, string _recordType, string _dataHash) public",
    "function checkIntegrity(string _recordId, string _recordType, string _dataHash) public view returns (bool)"
];

class SmartContractService {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log("Initializing Blockchain Service (Real Mode)...");

            // Validate Address
            if (!ethers.isAddress(CONTRACT_ADDRESS)) {
                throw new Error(`Invalid Contract Address: ${CONTRACT_ADDRESS}`);
            }

            // Connect to Blockchain Node with staticNetwork to bypass ENS resolution
            this.provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });

            // Use System Wallet
            const privateKey = process.env.SYSTEM_WALLET_KEY || process.env.PRIVATE_KEY;
            if (!privateKey) {
                throw new Error("Blockchain wallet private key not found in .env");
            }

            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);

            // Verify connection
            const network = await this.provider.getNetwork();
            console.log(`🔗 Blockchain Connected: ${network.name} (Chain ID: ${network.chainId})`);
            console.log(`📝 Contract Address: ${CONTRACT_ADDRESS}`);
            console.log(`🔐 Wallet Address: ${this.wallet.address}`);

            this.initialized = true;
        } catch (error) {
            console.error("❌ Blockchain Init Failed:", error.message);
            // We don't want the server to fail entirely, but we log the error
        }
    }

    /**
     * Publishes a record hash to the blockchain
     */
    async publishRecord(recordId, recordType, hash) {
        if (!this.initialized) await this.init();
        if (!this.initialized) return null;

        try {
            console.log(`Creating blockchain tx for ${recordType}: ${recordId}...`);
            // Set gas price if needed, but ethers 6 usually handles feeData well on Amoy
            const tx = await this.contract.verifyRecord(recordId, recordType, hash);
            console.log(`✅ Transaction Sent! Hash: ${tx.hash}`);
            return tx.hash;
        } catch (error) {
            console.error("❌ Blockchain Transaction Failed:", error.message);
            return null;
        }
    }

    /**
     * Checks integrity on-chain
     */
    async checkIntegrity(recordId, recordType, hash) {
        if (!this.initialized) await this.init();
        if (!this.initialized) return false;

        try {
            console.log(`Verifying on-chain: ${recordId} (Type: ${recordType})`);
            return await this.contract.checkIntegrity(recordId, recordType, hash);
        } catch (error) {
            console.error("❌ Blockchain Verification Failed:", error.message);
            return false;
        }
    }

    /**
     * Alias for checkIntegrity (Backward Compatibility)
     */
    async verifyOnChain(recordId, hash) {
        return this.checkIntegrity(recordId, "GENERIC", hash);
    }
}

module.exports = new SmartContractService();
