'use client';

import { FiArrowLeft, FiClock, FiSettings, FiMaximize2, FiActivity, FiDatabase, FiTarget } from 'react-icons/fi';
import styles from './PremiumPlaceholder.module.css';
import Link from 'next/link';

interface PremiumPlaceholderProps {
    agentName: string;
    icon: React.ReactNode;
}

export default function PremiumPlaceholder({ agentName, icon }: PremiumPlaceholderProps) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={`${styles.backBtn} ${styles.hideOnMobile}`}>
                    <FiArrowLeft /> Back to Agent Studio
                </Link>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn}><FiSettings /></button>
                    <button className={styles.iconBtn}><FiMaximize2 /></button>
                </div>
            </header>

            <main className={styles.content}>
                <div className={styles.heroSection}>
                    <div className={styles.badge}>DASHBOARD UNDER CONSTRUCTION</div>
                    <div className={styles.agentIcon}>{icon}</div>
                    <h1 className={styles.title}>{agentName}</h1>
                    <p className={styles.subtitle}>
                        We're building a state-of-the-art analytical interface for the {agentName}.
                        Integrating real-time Gemini 2.0 intelligence and predictive logistics models.
                    </p>

                    <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                            <span>Initialising Core Engine</span>
                            <span>85%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill}></div>
                        </div>
                    </div>
                </div>

                <div className={styles.mockGrid}>
                    <div className={styles.mockCard}>
                        <div className={styles.mockHeader}>
                            <FiActivity /> Live Metrics
                        </div>
                        <div className={styles.mockLines}>
                            <div className={styles.line}></div>
                            <div className={styles.line} style={{ width: '60%' }}></div>
                            <div className={styles.line} style={{ width: '40%' }}></div>
                        </div>
                    </div>
                    <div className={styles.mockCard}>
                        <div className={styles.mockHeader}>
                            <FiDatabase /> Data Streams
                        </div>
                        <div className={styles.mockCircle}></div>
                    </div>
                    <div className={styles.mockCard}>
                        <div className={styles.mockHeader}>
                            <FiTarget /> Predictive Analysis
                        </div>
                        <div className={styles.mockBars}>
                            <div className={styles.bar} style={{ height: '30%' }}></div>
                            <div className={styles.bar} style={{ height: '60%' }}></div>
                            <div className={styles.bar} style={{ height: '45%' }}></div>
                        </div>
                    </div>
                </div>
            </main>

            <div className={styles.backgroundEffects}>
                <div className={styles.glow}></div>
                <div className={styles.mesh}></div>
            </div>
        </div>
    );
}
