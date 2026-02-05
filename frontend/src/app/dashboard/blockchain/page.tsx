'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiShield, FiTruck, FiUser, FiPackage, FiChevronRight, FiLock, FiCheck, FiDatabase, FiFileText } from 'react-icons/fi';
import styles from './blockchain.module.css';

interface BlockchainModule {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    features: string[];
    color: string;
}

const blockchainModules: BlockchainModule[] = [
    {
        id: 'explorer',
        title: 'Blockchain Explorer',
        description: 'Visualize chain integrity, verify blocks, and explore the complete blockchain audit trail.',
        icon: <FiDatabase size={32} />,
        href: '/dashboard/blockchain/explorer',
        features: ['Chain visualization', 'Block verification', 'Tamper detection', 'Integrity reports'],
        color: '#06b6d4'
    },
    {
        id: 'pod',
        title: 'POD Verification',
        description: 'Proof of Delivery tokens with blockchain verification for tamper-proof delivery confirmation.',
        icon: <FiShield size={32} />,
        href: '/dashboard/blockchain/pod',
        features: ['Tamper-proof delivery proof', 'QR code verification', 'Chain integrity check', 'Public verification URL'],
        color: '#10b981'
    },
    {
        id: 'tod',
        title: 'Transfer of Documents',
        description: 'Secure, blockchain-verified transfer of bills of lading, invoices, and other critical documents.',
        icon: <FiFileText size={32} />,
        href: '/dashboard/blockchain/tod',
        features: ['Document Hashing', 'Ownership Transfer', 'Immutable History', 'Instant Verification'],
        color: '#6366f1'
    },
    {
        id: 'driver',
        title: 'Driver Monitoring',
        description: 'Blackbug driver behavior tracking with blockchain-backed trip records and safety scoring.',
        icon: <FiUser size={32} />,
        href: '/dashboard/blockchain/driver-monitoring',
        features: ['Behavior tracking', 'Safety score', 'Trip blockchain records', 'Driver analytics'],
        color: '#3b82f6'
    },
    {
        id: 'vahak',
        title: 'Vehicle Owners',
        description: 'Vahak vehicle owner registration and verification with encrypted sensitive data.',
        icon: <FiTruck size={32} />,
        href: '/dashboard/blockchain/vahak',
        features: ['Owner verification', 'Encrypted Aadhar/PAN', 'Ownership proof', 'Blockchain history'],
        color: '#8b5cf6'
    },
    {
        id: 'export',
        title: 'Export Logistics',
        description: 'Export document management and status tracking with complete blockchain traceability.',
        icon: <FiPackage size={32} />,
        href: '/dashboard/blockchain/exports',
        features: ['Document hashing', 'Status tracking', 'Customs clearance', 'Full audit trail'],
        color: '#f59e0b'
    }
];

export default function BlockchainPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiDatabase size={40} />
                    </div>
                    <div>
                        <h1>Blockchain Integration</h1>
                        <p>Tamper-proof records and verification for logistics operations</p>
                    </div>
                </div>
            </header>

            {/* Stats Banner */}
            <div className={styles.statsBanner}>
                <div className={styles.statItem}>
                    <FiLock className={styles.statIcon} />
                    <div>
                        <span className={styles.statValue}>SHA-256</span>
                        <span className={styles.statLabel}>Cryptographic Hashing</span>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <FiCheck className={styles.statIcon} />
                    <div>
                        <span className={styles.statValue}>Immutable</span>
                        <span className={styles.statLabel}>Tamper-Proof Records</span>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <FiDatabase className={styles.statIcon} />
                    <div>
                        <span className={styles.statValue}>Chain Linked</span>
                        <span className={styles.statLabel}>Block Verification</span>
                    </div>
                </div>
            </div>

            {/* Module Cards */}
            <div className={styles.modulesGrid}>
                {blockchainModules.map((module) => (
                    <Link href={module.href} key={module.id} className={styles.moduleCard}>
                        <div className={styles.moduleHeader}>
                            <div className={styles.moduleIcon} style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                                {module.icon}
                            </div>
                            <FiChevronRight className={styles.chevron} />
                        </div>
                        <h3>{module.title}</h3>
                        <p>{module.description}</p>
                        <ul className={styles.featureList}>
                            {module.features.map((feature, index) => (
                                <li key={index}>
                                    <FiCheck size={14} style={{ color: module.color }} />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </Link>
                ))}
            </div>

            {/* Info Section */}
            <div className={styles.infoSection}>
                <h2>How Blockchain Works in Logistics</h2>
                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <div className={styles.infoStep}>1</div>
                        <h4>Data Recording</h4>
                        <p>When an event occurs (delivery, trip, document upload), data is captured and prepared for blockchain storage.</p>
                    </div>
                    <div className={styles.infoCard}>
                        <div className={styles.infoStep}>2</div>
                        <h4>Hash Generation</h4>
                        <p>A unique SHA-256 cryptographic hash is generated from the data, creating a digital fingerprint.</p>
                    </div>
                    <div className={styles.infoCard}>
                        <div className={styles.infoStep}>3</div>
                        <h4>Block Creation</h4>
                        <p>The hash is linked to the previous block's hash, forming an unbreakable chain of records.</p>
                    </div>
                    <div className={styles.infoCard}>
                        <div className={styles.infoStep}>4</div>
                        <h4>Verification</h4>
                        <p>Anyone can verify data integrity by recalculating the hash and checking chain continuity.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
