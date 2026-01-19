'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './ZoneHeatmap.module.css';

interface ZoneData {
    lat: number;
    lng: number;
    intensity: number;
    name: string;
}

export default function ZoneHeatmap() {
    const { token } = useAuth();
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [totalShipments, setTotalShipments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);

    useEffect(() => {
        fetchZoneData();
    }, []);

    const fetchZoneData = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/zones/heatmap`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setZones(response.data.data.regions);
                setTotalShipments(response.data.data.totalShipments);
            }
        } catch (error) {
            console.error('Failed to fetch zone data:', error);
        }
        setLoading(false);
    };

    const getIntensityColor = (intensity: number) => {
        if (intensity >= 0.8) return 'rgba(255, 60, 60, 0.8)';
        if (intensity >= 0.6) return 'rgba(255, 140, 0, 0.8)';
        if (intensity >= 0.4) return 'rgba(255, 200, 0, 0.8)';
        return 'rgba(0, 200, 100, 0.8)';
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>🗺️</span>
                    <h1>Zone Analytics</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>Heatmap View</span>
                </div>
            </header>

            <div className={styles.content}>
                {/* Stats Bar */}
                <div className={styles.statsBar}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{zones.length}</span>
                        <span className={styles.statLabel}>Active Zones</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{totalShipments}</span>
                        <span className={styles.statLabel}>Total Shipments</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>95.2%</span>
                        <span className={styles.statLabel}>Avg Coverage</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>$3.45</span>
                        <span className={styles.statLabel}>Avg DAS Fee</span>
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    {/* Heatmap Visualization */}
                    <section className={styles.mapSection}>
                        <h3 className={styles.sectionTitle}>Delivery Density Heatmap</h3>

                        {loading ? (
                            <div className={styles.loading}>Loading zone data...</div>
                        ) : (
                            <div className={styles.heatmapContainer}>
                                <div className={styles.usMap}>
                                    {/* Simplified US Map Representation */}
                                    <svg viewBox="0 0 800 500" className={styles.mapSvg}>
                                        {/* Background */}
                                        <rect width="800" height="500" fill="rgba(20, 30, 50, 0.3)" rx="10" />

                                        {/* Grid lines */}
                                        {[...Array(8)].map((_, i) => (
                                            <line key={`h${i}`} x1="0" y1={i * 62.5} x2="800" y2={i * 62.5} stroke="rgba(255,255,255,0.05)" />
                                        ))}
                                        {[...Array(10)].map((_, i) => (
                                            <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="500" stroke="rgba(255,255,255,0.05)" />
                                        ))}

                                        {/* Zone heat points */}
                                        {zones.map((zone, index) => {
                                            // Map lat/lng to SVG coordinates (simplified)
                                            const x = ((zone.lng + 130) / 60) * 800;
                                            const y = ((50 - zone.lat) / 25) * 500;

                                            return (
                                                <g key={index} onClick={() => setSelectedZone(zone)} style={{ cursor: 'pointer' }}>
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={zone.intensity * 60}
                                                        fill={getIntensityColor(zone.intensity)}
                                                        className={styles.heatCircle}
                                                    />
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={10}
                                                        fill="#fff"
                                                    />
                                                    <text
                                                        x={x}
                                                        y={y + zone.intensity * 60 + 20}
                                                        fill="#fff"
                                                        fontSize="12"
                                                        textAnchor="middle"
                                                    >
                                                        {zone.name}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Legend */}
                                <div className={styles.legend}>
                                    <h4>Delivery Intensity</h4>
                                    <div className={styles.legendItems}>
                                        <div className={styles.legendItem}>
                                            <span style={{ background: 'rgba(255, 60, 60, 0.8)' }}></span>
                                            Very High (80%+)
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span style={{ background: 'rgba(255, 140, 0, 0.8)' }}></span>
                                            High (60-80%)
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span style={{ background: 'rgba(255, 200, 0, 0.8)' }}></span>
                                            Medium (40-60%)
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span style={{ background: 'rgba(0, 200, 100, 0.8)' }}></span>
                                            Low (&lt;40%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Zone Details Sidebar */}
                    <section className={styles.detailsSidebar}>
                        <h3 className={styles.sectionTitle}>Zone Details</h3>

                        {selectedZone ? (
                            <div className={styles.zoneCard}>
                                <h4>{selectedZone.name}</h4>
                                <div className={styles.zoneStats}>
                                    <div className={styles.zoneStat}>
                                        <span>Coverage</span>
                                        <strong>{(selectedZone.intensity * 100).toFixed(0)}%</strong>
                                    </div>
                                    <div className={styles.zoneStat}>
                                        <span>DAS Fee</span>
                                        <strong>${(3 + selectedZone.intensity * 2).toFixed(2)}</strong>
                                    </div>
                                    <div className={styles.zoneStat}>
                                        <span>Deliveries</span>
                                        <strong>{Math.floor(selectedZone.intensity * 1000)}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.selectPrompt}>
                                <p>Click on a zone to see details</p>
                            </div>
                        )}

                        <div className={styles.allZones}>
                            <h4>All Zones</h4>
                            <div className={styles.zoneList}>
                                {zones.map((zone, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.zoneListItem} ${selectedZone?.name === zone.name ? styles.active : ''}`}
                                        onClick={() => setSelectedZone(zone)}
                                    >
                                        <span className={styles.zoneName}>{zone.name}</span>
                                        <span
                                            className={styles.zoneIntensity}
                                            style={{ color: getIntensityColor(zone.intensity) }}
                                        >
                                            {(zone.intensity * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
