'use client';

import { FiActivity, FiDatabase, FiTarget, FiTruck, FiPackage, FiMap } from 'react-icons/fi';
import styles from './PremiumPlaceholder.module.css';

interface PremiumPlaceholderProps {
    agentName: string;
    agentId: string;
    icon: React.ReactNode;
}

// Theme configurations for each agent type
const agentThemes: { [key: string]: { color: string; gradient: string; features: string[]; animation: string } } = {
    fleet: {
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        features: ['Route Optimization', 'Vehicle Tracking', 'Driver Analytics'],
        animation: 'truck'
    },
    inventory: {
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        features: ['Stock Levels', 'Demand Forecasting', 'Reorder Alerts'],
        animation: 'boxes'
    },
    shipment: {
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        features: ['Live Tracking', 'ETA Predictions', 'Delivery Status'],
        animation: 'map'
    },
    zone: {
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        features: ['Heat Mapping', 'Zone Analytics', 'Demand Patterns'],
        animation: 'heatmap'
    },
    carrier: {
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
        features: ['Rate Comparison', 'Carrier Matching', 'Cost Optimization'],
        animation: 'compare'
    },
    support: {
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        features: ['AI Chat Support', 'Query Resolution', 'Knowledge Base'],
        animation: 'chat'
    }
};

export default function PremiumPlaceholder({ agentName, agentId, icon }: PremiumPlaceholderProps) {
    const theme = agentThemes[agentId] || agentThemes.fleet;

    return (
        <div className={styles.container}>
            <main className={styles.content}>
                <div className={styles.heroSection}>
                    <div className={styles.badge} style={{ borderColor: theme.color, color: theme.color }}>
                        🚀 COMING SOON
                    </div>

                    {/* Unique animated icon for each agent */}
                    <div className={styles.agentIconWrapper}>
                        <div
                            className={`${styles.agentIcon} ${styles[theme.animation]}`}
                            style={{ background: theme.gradient }}
                        >
                            {icon}
                        </div>
                        <div className={styles.iconRing} style={{ borderColor: `${theme.color}40` }} />
                        <div className={styles.iconRing2} style={{ borderColor: `${theme.color}20` }} />
                    </div>

                    <h1 className={styles.title} style={{
                        background: theme.gradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {agentName}
                    </h1>

                    <p className={styles.subtitle}>
                        We're crafting an intelligent analytics dashboard powered by AI.
                        <br />Advanced insights are on the way!
                    </p>

                    {/* Unique feature pills for each agent */}
                    <div className={styles.featurePills}>
                        {theme.features.map((feature, i) => (
                            <div
                                key={feature}
                                className={styles.featurePill}
                                style={{
                                    borderColor: `${theme.color}50`,
                                    animationDelay: `${i * 0.2}s`
                                }}
                            >
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                            <span>Building Intelligence Engine</span>
                            <span style={{ color: theme.color }}>
                                {agentId === 'fleet' ? '78%' :
                                    agentId === 'inventory' ? '65%' :
                                        agentId === 'shipment' ? '82%' : '70%'}
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    background: theme.gradient,
                                    width: agentId === 'fleet' ? '78%' :
                                        agentId === 'inventory' ? '65%' :
                                            agentId === 'shipment' ? '82%' : '70%'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Unique mock cards based on agent type */}
                <div className={styles.mockGrid}>
                    {agentId === 'fleet' && (
                        <>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiTruck /> Active Vehicles
                                </div>
                                <div className={styles.mockNumber} style={{ color: theme.color }}>24</div>
                                <div className={styles.mockSubtext}>On Route</div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiMap /> Routes Optimized
                                </div>
                                <div className={styles.truckAnimation}>
                                    <div className={styles.road}></div>
                                    <div className={styles.movingTruck}><FiTruck /></div>
                                </div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiActivity /> Fuel Efficiency
                                </div>
                                <div className={styles.gaugeAnimation} style={{ borderColor: theme.color }} />
                            </div>
                        </>
                    )}

                    {agentId === 'inventory' && (
                        <>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiPackage /> Stock Items
                                </div>
                                <div className={styles.boxesAnimation}>
                                    <div className={styles.box} style={{ background: `${theme.color}30` }}></div>
                                    <div className={styles.box} style={{ background: `${theme.color}50` }}></div>
                                    <div className={styles.box} style={{ background: `${theme.color}70` }}></div>
                                </div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiDatabase /> Inventory Levels
                                </div>
                                <div className={styles.barChart}>
                                    <div className={styles.chartBar} style={{ height: '40%', background: theme.color }}></div>
                                    <div className={styles.chartBar} style={{ height: '70%', background: theme.color }}></div>
                                    <div className={styles.chartBar} style={{ height: '55%', background: theme.color }}></div>
                                    <div className={styles.chartBar} style={{ height: '85%', background: theme.color }}></div>
                                </div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiTarget /> Reorder Alerts
                                </div>
                                <div className={styles.alertPulse} style={{ background: `${theme.color}20`, borderColor: theme.color }}>
                                    <span style={{ color: theme.color }}>3</span>
                                </div>
                            </div>
                        </>
                    )}

                    {(agentId !== 'fleet' && agentId !== 'inventory') && (
                        <>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiActivity /> Live Metrics
                                </div>
                                <div className={styles.mockLines}>
                                    <div className={styles.line} style={{ background: `${theme.color}40` }}></div>
                                    <div className={styles.line} style={{ width: '60%', background: `${theme.color}60` }}></div>
                                    <div className={styles.line} style={{ width: '40%', background: `${theme.color}80` }}></div>
                                </div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiDatabase /> Data Streams
                                </div>
                                <div className={styles.mockCircle} style={{ borderColor: theme.color }}></div>
                            </div>
                            <div className={styles.mockCard}>
                                <div className={styles.mockHeader} style={{ color: theme.color }}>
                                    <FiTarget /> Analysis
                                </div>
                                <div className={styles.mockBars}>
                                    <div className={styles.bar} style={{ height: '30%', background: theme.color }}></div>
                                    <div className={styles.bar} style={{ height: '60%', background: theme.color }}></div>
                                    <div className={styles.bar} style={{ height: '45%', background: theme.color }}></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <div className={styles.backgroundEffects}>
                <div className={styles.glow} style={{ background: `radial-gradient(circle at 50% 50%, ${theme.color}20, transparent 70%)` }}></div>
            </div>
        </div>
    );
}
