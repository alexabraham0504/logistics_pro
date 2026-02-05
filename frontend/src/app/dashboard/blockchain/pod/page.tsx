'use client';

import { useState, useEffect, useCallback } from 'react';
import { podAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiArrowLeft, FiSearch, FiShield, FiCheck, FiX,
    FiClock, FiMapPin, FiUser, FiHash, FiLink, FiRefreshCw
} from 'react-icons/fi';
import styles from './pod.module.css';

interface PODToken {
    _id: string;
    podToken: string;
    shipment: {
        _id: string;
        trackingNumber: string;
        status: string;
    };
    deliveryData: {
        timestamp: string;
        receiverName: string;
        location?: {
            address?: string;
            city?: string;
        };
        verificationMethod: string;
    };
    blockchainData: {
        hash: string;
        previousHash: string;
        blockNumber: number;
        timestamp: string;
    };
    isVerified: boolean;
}

interface VerificationResult {
    isValid: boolean;
    podToken: string;
    deliveryData: PODToken['deliveryData'];
    shipment: PODToken['shipment'];
    blockchainProof: {
        hash: string;
        previousHash: string;
        blockNumber: number;
        timestamp: string;
        integrityCheck: string;
    };
}

export default function PODVerificationPage() {
    const [searchToken, setSearchToken] = useState('');
    const [pods, setPods] = useState<PODToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const fetchPODs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await podAPI.getList({ limit: 20 });
            setPods(response.data.data.pods || []);
        } catch (err) {
            console.error('Failed to fetch PODs:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPODs();
    }, [fetchPODs]);

    const handleVerify = async (token?: string) => {
        const tokenToVerify = token || searchToken.trim();
        if (!tokenToVerify) {
            setError('Please enter a POD token');
            return;
        }

        setIsVerifying(true);
        setError('');
        setVerificationResult(null);

        try {
            const response = await podAPI.verify(tokenToVerify);
            setVerificationResult(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to verify POD token');
        } finally {
            setIsVerifying(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '-';
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/blockchain" className={styles.backBtn}>
                    <FiArrowLeft size={20} />
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiShield size={32} />
                    </div>
                    <div>
                        <h1>POD Verification</h1>
                        <p>Verify Proof of Delivery tokens on blockchain</p>
                    </div>
                </div>
            </header>

            {/* Search Section */}
            <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Enter POD token (e.g., POD-2026-ABC123)"
                        value={searchToken}
                        onChange={(e) => setSearchToken(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                        className={styles.verifyBtn}
                        onClick={() => handleVerify()}
                        disabled={isVerifying}
                    >
                        {isVerifying ? <FiRefreshCw className={styles.spin} /> : 'Verify'}
                    </button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
            </div>

            {/* Verification Result */}
            {verificationResult && (
                <div className={`${styles.resultCard} ${verificationResult.isValid ? styles.valid : styles.invalid}`}>
                    <div className={styles.resultHeader}>
                        <div className={styles.resultStatus}>
                            {verificationResult.isValid ? (
                                <>
                                    <div className={styles.statusIconValid}>
                                        <FiCheck size={24} />
                                    </div>
                                    <div>
                                        <h3>Verified on Blockchain</h3>
                                        <p>This POD token is authentic and untampered</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.statusIconInvalid}>
                                        <FiX size={24} />
                                    </div>
                                    <div>
                                        <h3>Verification Failed</h3>
                                        <p>This POD token may have been tampered with</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                            <FiHash />
                            <span>POD Token</span>
                            <strong>{verificationResult.podToken}</strong>
                        </div>
                        <div className={styles.resultItem}>
                            <FiUser />
                            <span>Receiver</span>
                            <strong>{verificationResult.deliveryData?.receiverName || '-'}</strong>
                        </div>
                        <div className={styles.resultItem}>
                            <FiClock />
                            <span>Delivery Time</span>
                            <strong>{verificationResult.deliveryData?.timestamp ? formatDate(verificationResult.deliveryData.timestamp) : '-'}</strong>
                        </div>
                        <div className={styles.resultItem}>
                            <FiMapPin />
                            <span>Location</span>
                            <strong>{verificationResult.deliveryData?.location?.city || '-'}</strong>
                        </div>
                    </div>

                    <div className={styles.blockchainProof}>
                        <h4><FiLink /> Blockchain Proof</h4>
                        <div className={styles.proofGrid}>
                            <div>
                                <span>Block Hash</span>
                                <code>{truncateHash(verificationResult.blockchainProof?.hash)}</code>
                            </div>
                            <div>
                                <span>Previous Hash</span>
                                <code>{truncateHash(verificationResult.blockchainProof?.previousHash)}</code>
                            </div>
                            <div>
                                <span>Block Number</span>
                                <code>#{verificationResult.blockchainProof?.blockNumber}</code>
                            </div>
                            <div>
                                <span>Integrity</span>
                                <code className={verificationResult.blockchainProof?.integrityCheck === 'PASSED' ? styles.passed : styles.failed}>
                                    {verificationResult.blockchainProof?.integrityCheck}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* POD List */}
            <div className={styles.listSection}>
                <div className={styles.listHeader}>
                    <h2>Recent POD Tokens</h2>
                    <button className={styles.refreshBtn} onClick={fetchPODs}>
                        <FiRefreshCw size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <div className={styles.loading}>
                        <div className="spinner"></div>
                    </div>
                ) : pods.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiShield size={48} />
                        <h3>No POD Tokens Yet</h3>
                        <p>POD tokens will appear here once deliveries are completed</p>
                    </div>
                ) : (
                    <div className={styles.podGrid}>
                        {pods.map((pod) => (
                            <div key={pod._id} className={styles.podCard}>
                                <div className={styles.podHeader}>
                                    <span className={styles.podToken}>{pod.podToken}</span>
                                    <span className={`${styles.badge} ${pod.isVerified ? styles.verified : ''}`}>
                                        {pod.isVerified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                                <div className={styles.podBody}>
                                    <div className={styles.podRow}>
                                        <FiUser size={14} />
                                        <span>{pod.deliveryData?.receiverName || '-'}</span>
                                    </div>
                                    <div className={styles.podRow}>
                                        <FiClock size={14} />
                                        <span>{pod.deliveryData?.timestamp ? formatDate(pod.deliveryData.timestamp) : '-'}</span>
                                    </div>
                                    <div className={styles.podRow}>
                                        <FiHash size={14} />
                                        <span className={styles.hash}>{truncateHash(pod.blockchainData?.hash)}</span>
                                    </div>
                                </div>
                                <button
                                    className={styles.verifyCardBtn}
                                    onClick={() => handleVerify(pod.podToken)}
                                >
                                    <FiShield size={14} />
                                    Verify
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
