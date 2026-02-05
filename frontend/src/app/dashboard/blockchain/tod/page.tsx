'use client';

import { useState, useEffect, useCallback } from 'react';
import { todAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiArrowLeft, FiFileText, FiShield, FiUser, FiClock, FiHash, FiRefreshCw, FiCheck, FiX, FiUsers, FiPlus, FiChevronDown
} from 'react-icons/fi';
import { shipmentsAPI } from '@/lib/api';
import styles from './tod.module.css';

interface TODToken {
    _id: string;
    todToken: string;
    shipment: {
        trackingNumber: string;
    };
    documentData: {
        documentType: string;
        documentUrl: string;
        sender: { firstName: string; lastName: string };
        receiver: { firstName: string; lastName: string };
        transferDate: string;
    };
    blockchainData: {
        hash: string;
        blockNumber: number;
        transactionHash?: string;
    };
}

interface VerificationResult {
    isValid: boolean;
    isChainVerified?: boolean;
    todToken: string;
    documentData: TODToken['documentData'];
    blockchainData: TODToken['blockchainData'];
}

export default function TODPage() {
    const [tods, setTods] = useState<TODToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

    const [isVerifying, setIsVerifying] = useState(false);

    // New Transfer State
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shipments, setShipments] = useState<any[]>([]);
    const [newTransfer, setNewTransfer] = useState({
        shipmentId: '',
        documentType: 'bill_of_lading',
        documentUrl: 'https://example.com/doc.pdf',
        notes: ''
    });

    const openCreateModal = async () => {
        setIsCreating(true);
        try {
            const res = await shipmentsAPI.getAll({ limit: 50 });
            setShipments(res.data.data.shipments || []);
        } catch (error) {
            console.error('Failed to load shipments', error);
        }
    };

    const handleCreateTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await todAPI.generate(newTransfer);
            setIsCreating(false);
            fetchTODs(); // Refresh list
            // Reset form
            setNewTransfer({
                shipmentId: '',
                documentType: 'bill_of_lading',
                documentUrl: 'https://example.com/doc.pdf',
                notes: ''
            });
        } catch (error) {
            console.error('Failed to create transfer', error);
            alert('Failed to transfer document. Check console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchTODs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await todAPI.getList({ limit: 20 });
            setTods(response.data.data.tods || []);
        } catch (err) {
            console.error('Failed to fetch TODs:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTODs();
    }, [fetchTODs]);

    const handleVerify = async (token: string) => {
        setIsVerifying(true);
        setVerificationResult(null);
        try {
            const response = await todAPI.verify(token);
            setVerificationResult(response.data.data);
        } catch (err) {
            console.error('Verification failed:', err);
            // Optionally set error state here
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
                        <FiFileText size={32} />
                    </div>
                    <div>
                        <h1>Transfer of Documents (TOD)</h1>
                        <p>Secure, blockchain-verified document transfers</p>
                    </div>
                </div>
                <button
                    className={styles.contractBtn}
                    onClick={() => window.open('/dashboard/blockchain/contracts', '_blank')}
                >
                    <FiShield size={16} /> View Smart Contract
                </button>
                <button
                    className={styles.createBtn}
                    onClick={openCreateModal}
                    style={{
                        marginLeft: '1rem',
                        backgroundColor: '#6366f1',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '8px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                    }}
                >
                    <FiPlus size={18} /> New Transfer
                </button>
            </header>

            {/* Create Transfer Modal */}
            {isCreating && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h3>New Document Transfer</h3>
                            <button onClick={() => setIsCreating(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateTransfer} className={styles.form} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Select Shipment</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        required
                                        value={newTransfer.shipmentId}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, shipmentId: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: 'white',
                                            appearance: 'none'
                                        }}
                                    >
                                        <option value="">-- Select a Shipment --</option>
                                        {shipments.map(s => (
                                            <option key={s._id} value={s._id}>{s.trackingNumber} ({s.origin.city} &rarr; {s.destination.city})</option>
                                        ))}
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Document Type</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={newTransfer.documentType}
                                        onChange={(e) => setNewTransfer({ ...newTransfer, documentType: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            color: 'white',
                                            appearance: 'none'
                                        }}
                                    >
                                        <option value="bill_of_lading">Bill of Lading</option>
                                        <option value="invoice">Commercial Invoice</option>
                                        <option value="packing_list">Packing List</option>
                                        <option value="customs_declaration">Customs Declaration</option>
                                        <option value="origin_certificate">Certificate of Origin</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Document Link (URL)</label>
                                <input
                                    type="url"
                                    required
                                    value={newTransfer.documentUrl}
                                    onChange={(e) => setNewTransfer({ ...newTransfer, documentUrl: e.target.value })}
                                    placeholder="https://..."
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Notes</label>
                                <textarea
                                    value={newTransfer.notes}
                                    onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '6px',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    marginTop: '1rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    padding: '0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? 'Transferring...' : 'Transfer to Blockchain'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Verification Result Modal */}
            {verificationResult && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Verification Result</h3>
                            <button onClick={() => setVerificationResult(null)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <div className={`${styles.resultCard} ${verificationResult.isValid ? styles.valid : styles.invalid}`}>
                            <div className={styles.resultStatus}>
                                {verificationResult.isValid ? (
                                    <>
                                        <div className={styles.statusIconValid}><FiCheck size={24} /></div>
                                        <div>
                                            <h3>Verified Authentic</h3>
                                            <p>
                                                Database integrity verified.
                                                {verificationResult.isChainVerified && (
                                                    <span style={{ display: 'block', color: '#4338ca', fontWeight: 600, marginTop: '4px' }}>
                                                        ✨ Confirmed on Smart Contract
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.statusIconInvalid}><FiX size={24} /></div>
                                        <div>
                                            <h3>Verification Failed</h3>
                                            <p>Blockchain hash mismatch. Data may be compromised.</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={styles.resultGrid}>
                                <div className={styles.resultItem}>
                                    <FiHash />
                                    <span>Token</span>
                                    <strong>{verificationResult.todToken}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <FiUsers />
                                    <span>Parties</span>
                                    <strong>
                                        {verificationResult.documentData?.sender?.firstName} &rarr; {verificationResult.documentData?.receiver?.firstName}
                                    </strong>
                                </div>
                            </div>

                            <div className={styles.blockchainProof}>
                                <h4><FiShield /> Cryptographic Proof</h4>
                                <div className={styles.proofGrid}>
                                    <div>
                                        <span>Hash</span>
                                        <code>{verificationResult.blockchainData?.hash}</code>
                                    </div>
                                    <div>
                                        <span>Block #</span>
                                        <code>{verificationResult.blockchainData?.blockNumber}</code>
                                    </div>
                                    {verificationResult.blockchainData?.transactionHash && (
                                        <div>
                                            <span>Tx Hash</span>
                                            <code>{truncateHash(verificationResult.blockchainData.transactionHash)}</code>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #374151', textAlign: 'center' }}>
                                    {verificationResult.blockchainData?.transactionHash ? (
                                        <a
                                            href={`https://amoy.polygonscan.com/tx/${verificationResult.blockchainData.transactionHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: '#818cf8', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}
                                        >
                                            View on PolygonScan ↗
                                        </a>
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                            Record stored in hybrid database (Off-chain)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List Section */}
            <div className={styles.listSection}>
                <div className={styles.listHeader}>
                    <h2>Recent Transfers</h2>
                    <button className={styles.refreshBtn} onClick={fetchTODs}>
                        <FiRefreshCw size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <div className={styles.loading}>
                        <div className="spinner"></div>
                    </div>
                ) : tods.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiFileText size={48} />
                        <h3>No Documents Transferred Yet</h3>
                        <p>Transfer documents to see them here.</p>
                    </div>
                ) : (
                    <div className={styles.todGrid}>
                        {tods.map((tod) => (
                            <div key={tod._id} className={styles.todCard}>
                                <div className={styles.todHeader}>
                                    <span className={styles.todToken}>{tod.todToken}</span>
                                    <span className={styles.badge}>Transferred</span>
                                </div>
                                <div className={styles.todBody}>
                                    <div className={styles.todRow}>
                                        <FiFileText size={14} />
                                        <span><strong>{tod.documentData.documentType.replace(/_/g, ' ').toUpperCase()}</strong></span>
                                    </div>
                                    <div className={styles.todRow}>
                                        <FiUser size={14} />
                                        <span>To: {tod.documentData.receiver ? `${tod.documentData.receiver.firstName} ${tod.documentData.receiver.lastName}` : 'Unknown'}</span>
                                    </div>
                                    <div className={styles.todRow}>
                                        <FiClock size={14} />
                                        <span>{formatDate(tod.documentData.transferDate)}</span>
                                    </div>
                                    <div className={styles.todRow}>
                                        <FiHash size={14} />
                                        <span className={styles.hash}>{truncateHash(tod.blockchainData.hash)}</span>
                                    </div>
                                </div>
                                <button
                                    className={styles.viewBtn}
                                    onClick={() => handleVerify(tod.todToken)}
                                    disabled={isVerifying}
                                >
                                    <FiShield size={14} />
                                    {isVerifying ? 'Verifying...' : 'Verify on Blockchain'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
