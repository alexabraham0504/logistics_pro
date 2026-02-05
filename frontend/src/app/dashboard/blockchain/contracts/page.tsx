'use client';
import { useState, useEffect } from 'react';
import styles from '../tod/tod.module.css'; // Reusing consistency
import { FiChevronLeft, FiFileText, FiCode } from 'react-icons/fi';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SmartContractViewer() {
    const [contractCode, setContractCode] = useState('Loading contract...');

    useEffect(() => {
        // In a real app we might fetch this from the backend
        // For now, hardcoding the Solidity logic we deployed
        setContractCode(`// SPDX-License-Identifier: MIT
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
}`);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard/blockchain/tod" className={styles.backBtn}>
                    <FiChevronLeft size={24} />
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon} style={{ background: '#ec4899' }}>
                        <FiCode size={32} />
                    </div>
                    <div>
                        <h1>Logistics Smart Contract</h1>
                        <p>Verified Source Code</p>
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                {/* Contract Metadata Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280' }}>Contract Name</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>LogisticsTracker</span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280' }}>Compiler Version</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>v0.8.19+commit.7dd6d404</span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280' }}>Deployed Address</span>
                        <span style={{ fontFamily: 'monospace', color: '#6366f1', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>
                            {process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS || "0x0DCd...BCD82"}
                        </span>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280' }}>Network</span>
                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                            <FiFileText /> {process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK_NAME || "Private Testnet (Local)"}
                        </span>
                    </div>
                </div>

                {/* Code Editor */}
                <div className={styles.listSection} style={{ padding: 0, overflow: 'hidden', background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #333', background: '#252526', color: '#cccccc', display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'sans-serif' }}>
                            <FiFileText color="#4EC9B0" />
                            LogisticsTracker.sol
                        </h3>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: 'auto', border: '1px solid #444', padding: '2px 8px', borderRadius: '4px' }}>
                            Rank 1/1
                        </span>
                    </div>
                    <SyntaxHighlighter
                        language="solidity"
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: '1.5rem', height: '600px', fontSize: '13px', lineHeight: '1.6' }}
                        showLineNumbers={true}
                        lineNumberStyle={{ color: '#858585', minWidth: '3em', paddingRight: '1em', textAlign: 'right' }}
                    >
                        {contractCode}
                    </SyntaxHighlighter>
                </div>
            </div>
        </div>
    );
}
