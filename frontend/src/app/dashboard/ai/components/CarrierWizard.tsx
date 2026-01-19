'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './CarrierWizard.module.css';

interface Phase {
    phase: number;
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
}

interface CarrierMix {
    carrier: string;
    parcelsPerDay: number;
}

interface ProposalData {
    phases: Phase[];
    savings: { zone0: Record<string, string> };
    carrierMix: CarrierMix[];
}

export default function CarrierWizard() {
    const { token } = useAuth();
    const [proposal, setProposal] = useState<ProposalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activePhase, setActivePhase] = useState(3);

    useEffect(() => {
        fetchProposalData();
    }, []);

    const fetchProposalData = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/carriers/proposal`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setProposal(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch proposal data:', error);
        }
        setLoading(false);
    };

    const getPhaseIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✓';
            case 'in_progress': return '●';
            default: return '○';
        }
    };

    const getCarrierColor = (carrier: string) => {
        switch (carrier.toLowerCase()) {
            case 'fedex': return '#4d148c';
            case 'ups': return '#351c15';
            case 'dhl': return '#ffcc00';
            case 'usps': return '#333366';
            default: return '#666';
        }
    };

    const totalParcels = proposal?.carrierMix.reduce((sum, c) => sum + c.parcelsPerDay, 0) || 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>🏢</span>
                    <h1>Carrier Specialist</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>Optimization Wizard</span>
                </div>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Loading proposal data...</div>
                ) : proposal ? (
                    <>
                        {/* Phase Stepper */}
                        <section className={styles.stepperSection}>
                            <h2 className={styles.sectionTitle}>Implementation Phases</h2>
                            <div className={styles.stepper}>
                                {proposal.phases.map((phase, index) => (
                                    <div
                                        key={phase.phase}
                                        className={`${styles.step} ${styles[phase.status]} ${activePhase === phase.phase ? styles.active : ''}`}
                                        onClick={() => setActivePhase(phase.phase)}
                                    >
                                        <div className={styles.stepIcon}>
                                            {getPhaseIcon(phase.status)}
                                        </div>
                                        <div className={styles.stepContent}>
                                            <span className={styles.stepNumber}>Phase {phase.phase}</span>
                                            <span className={styles.stepName}>{phase.name}</span>
                                        </div>
                                        {index < proposal.phases.length - 1 && (
                                            <div className={`${styles.stepLine} ${phase.status === 'completed' ? styles.completed : ''}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className={styles.mainGrid}>
                            {/* Savings Analysis */}
                            <section className={styles.savingsSection}>
                                <h3 className={styles.sectionTitle}>Zone 0 Savings Analysis</h3>
                                <div className={styles.savingsGrid}>
                                    {Object.entries(proposal.savings.zone0).map(([city, savings]) => (
                                        <div key={city} className={styles.savingsCard}>
                                            <span className={styles.savingsCity}>{city}</span>
                                            <span className={styles.savingsAmount}>{savings}</span>
                                            <span className={styles.savingsLabel}>per parcel</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.totalSavings}>
                                    <span>Projected Annual Savings</span>
                                    <strong>$1.2M+</strong>
                                </div>
                            </section>

                            {/* Carrier Mix */}
                            <section className={styles.carrierSection}>
                                <h3 className={styles.sectionTitle}>Carrier Mix Optimization</h3>
                                <div className={styles.carrierChart}>
                                    {proposal.carrierMix.map((carrier, index) => {
                                        const percentage = (carrier.parcelsPerDay / totalParcels) * 100;
                                        return (
                                            <div key={index} className={styles.carrierBar}>
                                                <div className={styles.carrierInfo}>
                                                    <span className={styles.carrierName}>{carrier.carrier}</span>
                                                    <span className={styles.carrierParcels}>{carrier.parcelsPerDay.toLocaleString()}/day</span>
                                                </div>
                                                <div className={styles.barContainer}>
                                                    <div
                                                        className={styles.barFill}
                                                        style={{
                                                            width: `${percentage}%`,
                                                            background: getCarrierColor(carrier.carrier)
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className={styles.carrierPercent}>{percentage.toFixed(1)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={styles.totalParcels}>
                                    <span>Total Daily Volume</span>
                                    <strong>{totalParcels.toLocaleString()} parcels</strong>
                                </div>
                            </section>
                        </div>

                        {/* Current Phase Details */}
                        <section className={styles.phaseDetails}>
                            <h3 className={styles.sectionTitle}>
                                Phase {activePhase} Details: {proposal.phases.find(p => p.phase === activePhase)?.name}
                            </h3>
                            <div className={styles.phaseContent}>
                                <div className={styles.phaseActions}>
                                    <h4>Actions Required</h4>
                                    <ul>
                                        <li>Review carrier contracts for the selected region</li>
                                        <li>Coordinate with warehouse teams for volume shifts</li>
                                        <li>Update routing tables in TMS</li>
                                        <li>Monitor SLA compliance during transition</li>
                                    </ul>
                                </div>
                                <div className={styles.phaseMetrics}>
                                    <h4>Expected Outcomes</h4>
                                    <div className={styles.metricCards}>
                                        <div className={styles.metricCard}>
                                            <span>Cost Reduction</span>
                                            <strong>12%</strong>
                                        </div>
                                        <div className={styles.metricCard}>
                                            <span>Transit Time</span>
                                            <strong>-0.5 days</strong>
                                        </div>
                                        <div className={styles.metricCard}>
                                            <span>Coverage</span>
                                            <strong>+15%</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <div className={styles.error}>Failed to load proposal data</div>
                )}
            </div>
        </div>
    );
}
