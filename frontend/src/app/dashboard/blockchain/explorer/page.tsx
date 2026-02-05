'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FiDatabase, FiChevronLeft, FiCheck, FiX, FiRefreshCw,
    FiShield, FiLink, FiClock, FiHash, FiActivity,
    FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';
import styles from './explorer.module.css';

interface Block {
    blockNumber: number;
    timestamp: string;
    hash: string;
    previousHash: string;
    isValid: boolean;
    nonce: number;
    displayData?: {
        token?: string;
        receiver?: string;
        eventType?: string;
        driver?: string;
        export?: string;
        vehicle?: string;
        owner?: string;
        status?: string;
    };
}

interface ChainValidation {
    chain: string;
    status: string;
    message: string;
    totalBlocks: number;
    statistics?: {
        firstBlock: { number: number; timestamp: string; hash: string };
        lastBlock: { number: number; timestamp: string; hash: string };
        totalTimespan: string;
        averageBlockTime: string;
    };
    integrity?: {
        allBlocksValid: boolean;
        tamperedCount: number;
        tamperedBlocks: Array<{ blockNumber: number; isValid: boolean }>;
    };
}

interface ExplorerData {
    chain: string;
    blocks: Block[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalBlocks: number;
    };
}

export default function BlockchainExplorerPage() {
    const [selectedChain, setSelectedChain] = useState<'pod' | 'driver' | 'export' | 'vahak'>('pod');
    const [explorerData, setExplorerData] = useState<ExplorerData | null>(null);
    const [validation, setValidation] = useState<ChainValidation | null>(null);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [page, setPage] = useState(1);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchExplorerData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE}/blockchain/explorer?chain=${selectedChain}&page=${page}&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setExplorerData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch explorer data:', error);
        }
        setLoading(false);
    };

    const validateChain = async () => {
        setValidating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE}/blockchain/validate/${selectedChain}?limit=100`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setValidation(data.data);
            }
        } catch (error) {
            console.error('Failed to validate chain:', error);
        }
        setValidating(false);
    };

    useEffect(() => {
        fetchExplorerData();
        validateChain();
    }, [selectedChain, page]);

    const chainNames = {
        pod: 'POD Token Chain',
        driver: 'Driver Behavior Chain',
        export: 'Export Logistics Chain',
        vahak: 'Vahak Owner Chain'
    };

    const formatHash = (hash: string) => {
        if (!hash) return 'N/A';
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/blockchain" className={styles.backButton}>
                    <FiChevronLeft size={20} />
                    Back
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiDatabase size={32} />
                    </div>
                    <div>
                        <h1>Blockchain Explorer</h1>
                        <p>Visualize and verify blockchain integrity</p>
                    </div>
                </div>
            </header>

            {/* Chain Selector */}
            <div className={styles.chainSelector}>
                {(['pod', 'driver', 'export', 'vahak'] as const).map((chain) => (
                    <button
                        key={chain}
                        className={`${styles.chainButton} ${selectedChain === chain ? styles.active : ''}`}
                        onClick={() => { setSelectedChain(chain); setPage(1); }}
                    >
                        {chainNames[chain]}
                    </button>
                ))}
            </div>

            {/* Validation Status */}
            {validation && (
                <div className={`${styles.validationCard} ${validation.status === 'valid' ? styles.valid : styles.invalid}`}>
                    <div className={styles.validationHeader}>
                        {validation.status === 'valid' ? (
                            <FiCheckCircle className={styles.validIcon} size={32} />
                        ) : (
                            <FiAlertTriangle className={styles.invalidIcon} size={32} />
                        )}
                        <div>
                            <h3>{validation.status === 'valid' ? 'Chain Verified' : 'Integrity Issues Detected'}</h3>
                            <p>{validation.message}</p>
                        </div>
                        <button
                            className={styles.refreshButton}
                            onClick={validateChain}
                            disabled={validating}
                        >
                            <FiRefreshCw className={validating ? styles.spinning : ''} />
                            {validating ? 'Validating...' : 'Re-validate'}
                        </button>
                    </div>

                    <div className={styles.validationStats}>
                        <div className={styles.statBox}>
                            <FiDatabase />
                            <span className={styles.statValue}>{validation.totalBlocks}</span>
                            <span className={styles.statLabel}>Total Blocks</span>
                        </div>
                        {validation.statistics && (
                            <>
                                <div className={styles.statBox}>
                                    <FiClock />
                                    <span className={styles.statValue}>{validation.statistics.averageBlockTime}</span>
                                    <span className={styles.statLabel}>Avg Block Time</span>
                                </div>
                                <div className={styles.statBox}>
                                    <FiActivity />
                                    <span className={styles.statValue}>{validation.statistics.totalTimespan}</span>
                                    <span className={styles.statLabel}>Chain Age</span>
                                </div>
                            </>
                        )}
                        {validation.integrity && (
                            <div className={styles.statBox}>
                                <FiShield />
                                <span className={styles.statValue}>
                                    {validation.integrity.allBlocksValid ? 'All Valid' : `${validation.integrity.tamperedCount} Issues`}
                                </span>
                                <span className={styles.statLabel}>Integrity</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Block Chain Visualization */}
            <div className={styles.chainVisualization}>
                <h2><FiLink /> Chain Blocks</h2>

                {loading ? (
                    <div className={styles.loading}>
                        <FiRefreshCw className={styles.spinning} size={32} />
                        <p>Loading blocks...</p>
                    </div>
                ) : explorerData && explorerData.blocks.length > 0 ? (
                    <div className={styles.blockList}>
                        {explorerData.blocks.map((block, index) => (
                            <div key={`${block.blockNumber}-${index}-${block.hash?.substring(0, 8)}`} className={styles.blockWrapper}>
                                <div className={`${styles.block} ${block.isValid ? styles.validBlock : styles.invalidBlock}`}>
                                    <div className={styles.blockHeader}>
                                        <span className={styles.blockNumber}>Block #{block.blockNumber}</span>
                                        {block.isValid ? (
                                            <span className={styles.validBadge}><FiCheck /> Verified</span>
                                        ) : (
                                            <span className={styles.invalidBadge}><FiX /> Tampered</span>
                                        )}
                                    </div>

                                    <div className={styles.blockBody}>
                                        <div className={styles.hashRow}>
                                            <FiHash />
                                            <span className={styles.hashLabel}>Hash:</span>
                                            <code className={styles.hash}>{formatHash(block.hash)}</code>
                                        </div>
                                        <div className={styles.hashRow}>
                                            <FiLink />
                                            <span className={styles.hashLabel}>Prev:</span>
                                            <code className={styles.hash}>{formatHash(block.previousHash)}</code>
                                        </div>
                                        <div className={styles.timestampRow}>
                                            <FiClock />
                                            <span>{formatDate(block.timestamp)}</span>
                                        </div>

                                        {block.displayData && (
                                            <div className={styles.blockData}>
                                                {block.displayData.token && (
                                                    <span className={styles.dataTag}>📦 {block.displayData.token}</span>
                                                )}
                                                {block.displayData.receiver && (
                                                    <span className={styles.dataTag}>👤 {block.displayData.receiver}</span>
                                                )}
                                                {block.displayData.eventType && (
                                                    <span className={styles.dataTag}>⚡ {block.displayData.eventType}</span>
                                                )}
                                                {block.displayData.vehicle && (
                                                    <span className={styles.dataTag}>🚛 {block.displayData.vehicle}</span>
                                                )}
                                                {block.displayData.owner && (
                                                    <span className={styles.dataTag}>👤 {block.displayData.owner}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chain link visualization */}
                                {index < explorerData.blocks.length - 1 && (
                                    <div className={styles.chainLink}>
                                        <div className={styles.linkLine}></div>
                                        <FiLink className={styles.linkIcon} />
                                        <div className={styles.linkLine}></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FiDatabase size={48} />
                        <h3>No Blocks Found</h3>
                        <p>This chain has no blocks yet. Generate some data to see blocks here.</p>
                    </div>
                )}

                {/* Pagination */}
                {explorerData && explorerData.pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {explorerData.pagination.totalPages}</span>
                        <button
                            disabled={page === explorerData.pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* How It Works */}
            <div className={styles.infoSection}>
                <h3>How Blockchain Verification Works</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <div className={styles.infoNumber}>1</div>
                        <div>
                            <strong>Hash Calculation</strong>
                            <p>Each block's hash is recalculated from its data</p>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <div className={styles.infoNumber}>2</div>
                        <div>
                            <strong>Hash Comparison</strong>
                            <p>Calculated hash must match stored hash</p>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <div className={styles.infoNumber}>3</div>
                        <div>
                            <strong>Chain Linkage</strong>
                            <p>Each block's previousHash must match prior block's hash</p>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <div className={styles.infoNumber}>4</div>
                        <div>
                            <strong>Tamper Detection</strong>
                            <p>Any modification breaks the chain verification</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
