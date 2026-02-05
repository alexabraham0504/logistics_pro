// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LogisticsTracker
 * @dev Stores hashes of logistics documents (POD, TOD, Vahak) on-chain for immutability.
 */
contract LogisticsTracker {
    
    // Event emitted when a new record is verified
    event RecordVerified(
        string indexed recordId,    // Usage: The simulated token ID (e.g., POD-123)
        string recordType,          // Usage: "POD", "TOD", "VAHAK"
        string dataHash,            // Usage: The SHA-256 hash of the data
        uint256 timestamp,
        address indexed recorder    // Usage: The wallet that recorded it
    );

    struct Record {
        string recordType;
        string dataHash;
        uint256 timestamp;
        address recorder;
        bool exists;
    }

    // Mapping from Record ID to the Record data
    mapping(string => Record) public records;

    // Owner of the contract
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Verifies and stores a record hash on the blockchain.
     * @param _recordId The unique ID from the centralized database (e.g. POD Token)
     * @param _recordType The type of record (POD, TOD, SHIPMENT)
     * @param _dataHash The centralized calculated hash (SHA-256)
     */
    function verifyRecord(string memory _recordId, string memory _recordType, string memory _dataHash) public {
        // Optional: specific check if record already exists to prevent overwrite?
        // For now, we allow updates as "history", but normally blockchain is append-only.
        // Let's just store it.
        
        records[_recordId] = Record({
            recordType: _recordType,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            recorder: msg.sender,
            exists: true
        });

        emit RecordVerified(_recordId, _recordType, _dataHash, block.timestamp, msg.sender);
    }

    /**
     * @dev Utility to verify if a hash matches the on-chain record
     */
    function checkIntegrity(string memory _recordId, string memory _providedHash) public view returns (bool) {
        require(records[_recordId].exists, "Record does not exist");
        return (keccak256(abi.encodePacked(records[_recordId].dataHash)) == keccak256(abi.encodePacked(_providedHash)));
    }
}
