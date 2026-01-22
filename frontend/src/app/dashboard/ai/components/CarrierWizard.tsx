'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './CarrierWizard.module.css';

interface Phase {
    phase: number;
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
}

interface CarrierMix {
    carrier: string;
    current: number;
    recommended: number;
}

interface ProposalData {
    phases: Phase[];
    savings: { zone0: Record<string, string> };
    carrierMix: CarrierMix[];
}

const DEFAULT_PHASES: Phase[] = [
    { phase: 1, name: 'Move DHL Volume', status: 'completed' },
    { phase: 2, name: 'Move Recommended Volume', status: 'completed' },
    { phase: 3, name: 'Activate North East Region', status: 'completed' },
    { phase: 4, name: 'Activate West Region', status: 'in_progress' },
    { phase: 5, name: 'Activate North Region', status: 'pending' },
    { phase: 6, name: 'Complete Setup', status: 'pending' },
];

const ZONE_SAVINGS = {
    'NYC': '$3.45',
    'NJ': '$3.10',
    'Boston': '$3.53',
    'Philly': '$3.75'
};

const CARRIER_MIX: CarrierMix[] = [
    { carrier: 'FedEx', current: 5500, recommended: 5500 },
    { carrier: 'DHL', current: 0, recommended: 5000 },
    { carrier: 'UPS', current: 8009, recommended: 3009 },
];

export default function CarrierWizard() {
    const { token } = useAuth();
    const [proposal, setProposal] = useState<ProposalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activePhase, setActivePhase] = useState(4);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProposalData();
    }, []);

    const fetchProposalData = async () => {
        try {
            const response = await api.get('/ai/carriers/proposal');

            if (response.data.success) {
                setProposal(response.data.data);
            } else {
                // Use default data
                setProposal({
                    phases: DEFAULT_PHASES,
                    savings: { zone0: ZONE_SAVINGS },
                    carrierMix: CARRIER_MIX
                });
            }
        } catch (error) {
            console.error('Failed to fetch proposal data:', error);
            // Use default data on error
            setProposal({
                phases: DEFAULT_PHASES,
                savings: { zone0: ZONE_SAVINGS },
                carrierMix: CARRIER_MIX
            });
        }
        setLoading(false);
    };

    const handlePrevPhase = () => {
        if (activePhase > 1) setActivePhase(prev => prev - 1);
    };

    const handleNextPhase = () => {
        if (activePhase < 6) setActivePhase(prev => prev + 1);
    };

    const phases = proposal?.phases || DEFAULT_PHASES;
    const carrierMix = proposal?.carrierMix || CARRIER_MIX;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/dashboard/ai" className={styles.backBtn}>
                        ← Back
                    </Link>
                    <div className={styles.branding}>
                        <h1 className={styles.title}>Carrier Proposal</h1>
                        <p className={styles.tagline}>More Volume, More Saving</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search partners, clients, or financial data..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading proposal data...</div>
                ) : (
                    <>
                        {/* Phase Stepper - Enhanced */}
                        <section className={styles.stepperSection}>
                            <div className={styles.stepper}>
                                {phases.map((phase, index) => (
                                    <div
                                        key={phase.phase}
                                        className={`${styles.step} ${styles[phase.status]} ${activePhase === phase.phase ? styles.active : ''}`}
                                        onClick={() => setActivePhase(phase.phase)}
                                    >
                                        <div className={styles.stepDot}></div>
                                        <div className={styles.stepContent}>
                                            <span className={styles.stepNumber}>Phase {phase.phase}</span>
                                            <span className={styles.stepName}>{phase.name}</span>
                                        </div>
                                        {index < phases.length - 1 && (
                                            <div className={`${styles.stepLine} ${phase.status === 'completed' ? styles.completedLine : ''}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.stepperNav}>
                                <button
                                    className={styles.navBtn}
                                    onClick={handlePrevPhase}
                                    disabled={activePhase <= 1}
                                >
                                    Back
                                </button>
                                <button
                                    className={`${styles.navBtn} ${styles.nextBtn}`}
                                    onClick={handleNextPhase}
                                    disabled={activePhase >= 6}
                                >
                                    Next
                                </button>
                            </div>
                        </section>

                        <div className={styles.mainGrid}>
                            {/* Left Side - Map */}
                            <section className={styles.mapSection}>
                                <p className={styles.mapHint}>
                                    You save more by adding North East regional carriers
                                </p>

                                <div className={styles.mapContainer}>
                                    {/* US Map SVG with route lines */}
                                    <svg viewBox="0 0 800 500" className={styles.mapSvg}>
                                        {/* Background */}
                                        <rect width="800" height="500" fill="rgba(10, 10, 20, 0.9)" rx="10" />

                                        {/* Grid dots */}
                                        {[...Array(20)].map((_, i) => (
                                            [...Array(12)].map((_, j) => (
                                                <circle
                                                    key={`${i}-${j}`}
                                                    cx={i * 40 + 20}
                                                    cy={j * 42 + 20}
                                                    r={1.5}
                                                    fill="rgba(255,255,255,0.1)"
                                                />
                                            ))
                                        ))}

                                        {/* Origin point */}
                                        <circle cx="280" cy="280" r="12" fill="#f97316" />
                                        <circle cx="280" cy="280" r="6" fill="#fff" />

                                        {/* Route lines */}
                                        {[
                                            { x: 600, y: 120 },
                                            { x: 650, y: 180 },
                                            { x: 700, y: 240 },
                                            { x: 680, y: 320 },
                                            { x: 620, y: 380 },
                                            { x: 550, y: 400 },
                                            { x: 500, y: 150 },
                                            { x: 580, y: 200 },
                                        ].map((dest, i) => (
                                            <g key={i}>
                                                <line
                                                    x1="280"
                                                    y1="280"
                                                    x2={dest.x}
                                                    y2={dest.y}
                                                    stroke="#f97316"
                                                    strokeWidth="1"
                                                    strokeDasharray="4,4"
                                                    opacity="0.6"
                                                />
                                                <circle cx={dest.x} cy={dest.y} r="4" fill="#f97316" />
                                            </g>
                                        ))}
                                    </svg>
                                </div>
                            </section>

                            {/* Right Side - Details */}
                            <section className={styles.detailsSection}>
                                {/* Zone 0 Savings */}
                                <div className={styles.savingsCard}>
                                    <h3 className={styles.cardTitle}>Zone 0 Savings</h3>
                                    <p className={styles.cardSubtitle}>
                                        Population Based vs. Distance based technique
                                    </p>

                                    <div className={styles.savingsGrid}>
                                        {Object.entries(ZONE_SAVINGS).map(([city, savings], idx) => (
                                            <div
                                                key={city}
                                                className={`${styles.savingsItem} ${idx === 1 ? styles.highlighted : ''}`}
                                            >
                                                <span className={styles.cityName}>{city}</span>
                                                <span className={styles.cityPrice}>{savings}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini chart placeholder */}
                                    <div className={styles.miniChart}>
                                        <div className={styles.chartBar} style={{ height: '60%' }}></div>
                                        <div className={styles.chartBar} style={{ height: '80%' }}></div>
                                        <div className={styles.chartBar} style={{ height: '55%' }}></div>
                                        <div className={styles.chartBar} style={{ height: '70%' }}></div>
                                    </div>
                                </div>

                                {/* Carrier Mix */}
                                <div className={styles.carrierCard}>
                                    <h3 className={styles.cardTitle}>Carrier Mix (parcels/day)</h3>

                                    <div className={styles.carrierTable}>
                                        <div className={styles.carrierRow}>
                                            <span className={styles.carrierName}>FedEx</span>
                                            <span className={styles.carrierType}>Ground Economy</span>
                                            <span className={styles.carrierValue}>{carrierMix[0]?.current || 5500}</span>
                                            <span className={styles.carrierValue}>{carrierMix[0]?.recommended || 5500}</span>
                                        </div>
                                        <div className={styles.carrierRow}>
                                            <span className={styles.carrierName}>DHL</span>
                                            <span className={styles.carrierType}>eCommerce</span>
                                            <span className={styles.carrierValue}>{carrierMix[1]?.current || 0}</span>
                                            <span className={styles.carrierValue}>{carrierMix[1]?.recommended || 5000}</span>
                                        </div>
                                        <div className={styles.carrierRow}>
                                            <span className={styles.carrierName}>UPS</span>
                                            <span className={styles.carrierType}></span>
                                            <span className={styles.carrierValue}>{carrierMix[2]?.current || 8009}</span>
                                            <span className={styles.carrierValue}>{carrierMix[2]?.recommended || 3009}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
