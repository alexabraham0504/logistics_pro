'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './ZoneHeatmap.module.css';

interface ZoneData {
    lat: number;
    lng: number;
    intensity: number;
    name: string;
}

const TABS = ['Carriers', 'States', 'Compare', 'History'];
const SERVICE_TYPES = ['DAS', 'EDAS'];

export default function ZoneHeatmap() {
    const { token } = useAuth();
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [totalShipments, setTotalShipments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);

    // New filter states
    const [activeTab, setActiveTab] = useState('Carriers');
    const [carrierType, setCarrierType] = useState('UPS');
    const [serviceType, setServiceType] = useState('DAS');
    const [year, setYear] = useState(2022);

    useEffect(() => {
        fetchZoneData();
    }, []);

    const fetchZoneData = async () => {
        try {
            const response = await api.get('/ai/zones/heatmap');

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
        // Red gradient for heatmap
        const red = Math.floor(255 * intensity);
        return `rgba(${red}, ${Math.floor(60 * (1 - intensity))}, ${Math.floor(60 * (1 - intensity))}, 0.8)`;
    };

    const minValue = 15424;
    const maxValue = 32678687;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>🗺️</span>
                    <h1>ZoneCast</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>DAS/EDAS Coverage</span>
                </div>
            </header>

            <div className={styles.content}>
                {/* Title and Description */}
                <div className={styles.titleSection}>
                    <p className={styles.description}>
                        ZoneCast has an exclusive capability of mapping all the destinations, finding and
                        quantifying the real-life grantees with DAS EDAS.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className={styles.tabNav}>
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                    <button className={styles.comingSoonTab}>Coming Soon</button>
                </div>

                <div className={styles.mainGrid}>
                    {/* Map Section */}
                    <section className={styles.mapSection}>
                        <h3 className={styles.sectionTitle}>DAS/EDAS Coverage</h3>

                        {loading ? (
                            <div className={styles.loading}>Loading zone data...</div>
                        ) : (
                            <div className={styles.heatmapContainer}>
                                <div className={styles.usMap}>
                                    {/* US Map SVG with heatmap dots */}
                                    <svg viewBox="0 0 800 500" className={styles.mapSvg}>
                                        {/* Background */}
                                        <rect width="800" height="500" fill="rgba(10, 10, 15, 0.8)" rx="10" />

                                        {/* Grid lines */}
                                        {[...Array(8)].map((_, i) => (
                                            <line key={`h${i}`} x1="0" y1={i * 62.5} x2="800" y2={i * 62.5} stroke="rgba(255,255,255,0.03)" />
                                        ))}
                                        {[...Array(10)].map((_, i) => (
                                            <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="500" stroke="rgba(255,255,255,0.03)" />
                                        ))}

                                        {/* Heatmap dots - Dense coverage */}
                                        {[...Array(200)].map((_, i) => {
                                            const x = 100 + Math.random() * 600;
                                            const y = 80 + Math.random() * 350;
                                            const intensity = Math.random();
                                            return (
                                                <circle
                                                    key={i}
                                                    cx={x}
                                                    cy={y}
                                                    r={3 + intensity * 4}
                                                    fill={getIntensityColor(intensity)}
                                                    className={styles.heatDot}
                                                />
                                            );
                                        })}

                                        {/* Zone heat points */}
                                        {zones.map((zone, index) => {
                                            const x = ((zone.lng + 130) / 60) * 800;
                                            const y = ((50 - zone.lat) / 25) * 500;

                                            return (
                                                <g key={index} onClick={() => setSelectedZone(zone)} style={{ cursor: 'pointer' }}>
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={zone.intensity * 40}
                                                        fill={getIntensityColor(zone.intensity)}
                                                        className={styles.heatCircle}
                                                    />
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={6}
                                                        fill="#fff"
                                                    />
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Legend */}
                                <div className={styles.legend}>
                                    <span>{minValue.toLocaleString()}</span>
                                    <div className={styles.legendGradient}></div>
                                    <span>{maxValue.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Filters Sidebar */}
                    <section className={styles.filtersSidebar}>
                        {/* Carrier Type */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Carrier Type</label>
                            <select
                                className={styles.filterSelect}
                                value={carrierType}
                                onChange={(e) => setCarrierType(e.target.value)}
                            >
                                <option value="UPS">UPS</option>
                                <option value="FedEx">FedEx</option>
                                <option value="USPS">USPS</option>
                                <option value="DHL">DHL</option>
                            </select>
                        </div>

                        {/* Service Type */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Service Type</label>
                            <div className={styles.toggleGroup}>
                                <span className={styles.toggleLabel}>DAS-EDAS</span>
                                <div className={styles.toggleButtons}>
                                    {SERVICE_TYPES.map((type) => (
                                        <button
                                            key={type}
                                            className={`${styles.toggleBtn} ${serviceType === type ? styles.activeToggle : ''}`}
                                            onClick={() => setServiceType(type)}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Year Slider */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Year</label>
                            <div className={styles.yearDisplay}>{year}</div>
                            <input
                                type="range"
                                min="2018"
                                max="2024"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className={styles.yearSlider}
                            />
                            <div className={styles.yearLabels}>
                                <span>2018</span>
                                <span>2024</span>
                            </div>
                        </div>

                        {/* Zone Details */}
                        {selectedZone && (
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
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
