'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './TrackingView.module.css';

interface TrackingEvent {
    status: string;
    location: string;
    timestamp: string;
    notes?: string;
}

interface ShipmentData {
    trackingNumber: string;
    status: string;
    origin: { address: string };
    destination: { address: string };
    estimatedDelivery: string;
    timeline: TrackingEvent[];
    coordinates?: { lat: number; lng: number };
}

const SAMPLE_TRACKING_IDS = ['PMWONKZW', 'PTN522K6', 'PUBAQU3G', 'PHNH8CON', 'PCZQSP68', 'PAKEPABQ'];

const TRACKING_STAGES = [
    { id: 'label_created', label: 'Label Created', angle: -90 },
    { id: 'picked_up', label: 'Picked Up', angle: -45 },
    { id: 'in_transit', label: 'In Transit', angle: 0 },
    { id: 'out_for_delivery', label: 'Out for Delivery', angle: 45 },
    { id: 'delivered', label: 'Delivered', angle: 90 },
];

export default function TrackingView() {
    const { token } = useAuth();
    const [trackingId, setTrackingId] = useState('');
    const [shipment, setShipment] = useState<ShipmentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);

    const handleTrack = async () => {
        if (!trackingId.trim()) {
            setError('Please enter a tracking number');
            return;
        }

        setLoading(true);
        setError('');
        setShowSuggestions(false);

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/tracking/${trackingId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setShipment(response.data.data.shipment);
            } else {
                setError('Shipment not found');
            }
        } catch (err) {
            setError('Shipment not found. Please check the tracking number.');
        }

        setLoading(false);
    };

    const getCurrentStageIndex = () => {
        if (!shipment) return 0;
        const statusMap: Record<string, number> = {
            'pending': 0,
            'label_created': 0,
            'picked_up': 1,
            'in_transit': 2,
            'out_for_delivery': 3,
            'delivered': 4,
        };
        return statusMap[shipment.status.toLowerCase()] || 2;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return '#00d26a';
            case 'in_transit': return '#ff8c00';
            case 'out_for_delivery': return '#00b4d8';
            case 'picked_up': return '#00b4d8';
            default: return '#888';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredSuggestions = SAMPLE_TRACKING_IDS.filter(id =>
        id.toLowerCase().includes(trackingId.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>📍</span>
                    <h1>Tracking</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>Live Tracking</span>
                </div>
            </header>

            <div className={styles.content}>
                {/* Title Section */}
                <div className={styles.titleSection}>
                    <h2 className={styles.pageTitle}>Tracking</h2>
                    <p className={styles.pageSubtitle}>
                        Stay informed with real-time visibility and reliability for peace of mind with every package.
                    </p>
                </div>

                {/* Circular Progress Wheel */}
                <div className={styles.wheelSection}>
                    <div className={styles.progressWheel}>
                        <svg viewBox="0 0 300 300" className={styles.wheelSvg}>
                            {/* Background arc */}
                            <circle
                                cx="150"
                                cy="150"
                                r="120"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="4"
                            />

                            {/* Progress arc */}
                            <circle
                                cx="150"
                                cy="150"
                                r="120"
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="4"
                                strokeDasharray={`${(getCurrentStageIndex() + 1) / 5 * 754} 754`}
                                strokeLinecap="round"
                                transform="rotate(-90 150 150)"
                                className={styles.progressArc}
                            />

                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ea580c" />
                                </linearGradient>
                            </defs>

                            {/* Stage markers */}
                            {TRACKING_STAGES.map((stage, index) => {
                                const angleRad = (stage.angle - 90) * (Math.PI / 180);
                                const x = 150 + 120 * Math.cos(angleRad);
                                const y = 150 + 120 * Math.sin(angleRad);
                                const isActive = index <= getCurrentStageIndex();
                                const isCurrent = index === getCurrentStageIndex();

                                return (
                                    <g key={stage.id}>
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={isCurrent ? 12 : 8}
                                            fill={isActive ? '#f97316' : 'rgba(255,255,255,0.2)'}
                                            className={isCurrent ? styles.currentDot : ''}
                                        />
                                        <text
                                            x={x + (stage.angle < 0 ? -20 : stage.angle > 0 ? 20 : 0)}
                                            y={y + (stage.angle === -90 ? -25 : stage.angle === 90 ? 35 : 0)}
                                            fill={isActive ? '#fff' : '#666'}
                                            fontSize="10"
                                            textAnchor="middle"
                                            className={styles.stageLabel}
                                        >
                                            {stage.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Center search input */}
                        <div className={styles.centerInput}>
                            <label className={styles.inputLabel}>Enter Your Tracking ID</label>
                            <div className={styles.searchWrapper}>
                                <input
                                    type="text"
                                    placeholder="e.g., PMWONKZW"
                                    value={trackingId}
                                    onChange={(e) => {
                                        setTrackingId(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                                    className={styles.searchInput}
                                />

                                {/* Suggestions dropdown */}
                                {showSuggestions && trackingId && filteredSuggestions.length > 0 && (
                                    <div className={styles.suggestions}>
                                        {filteredSuggestions.map((id) => (
                                            <button
                                                key={id}
                                                className={styles.suggestionItem}
                                                onClick={() => {
                                                    setTrackingId(id);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                {id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleTrack}
                                disabled={loading}
                                className={styles.trackBtn}
                            >
                                {loading ? 'Tracking...' : 'Track'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                {/* Results Section */}
                {shipment && (
                    <div className={styles.resultsSection}>
                        {/* Info Cards */}
                        <div className={styles.infoCards}>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>Tracking ID</span>
                                <span className={styles.infoValue}>{shipment.trackingNumber}</span>
                                <button className={styles.infoLink} onClick={() => setTrackingId('')}>
                                    Track another ID
                                </button>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>Destination</span>
                                <span className={styles.infoValue}>{shipment.destination?.address || 'Rockville MD 20853'}</span>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>Current Status</span>
                                <span className={styles.infoValue} style={{ color: getStatusColor(shipment.status) }}>
                                    {shipment.status.replace('_', ' ')}
                                </span>
                                <button className={styles.infoLink} onClick={() => setShowMapModal(true)}>
                                    Tracking History
                                </button>
                            </div>
                            <div className={styles.infoCard}>
                                <span className={styles.infoLabel}>Parcel Details</span>
                                <button className={styles.infoLink}>Click to View</button>
                            </div>
                        </div>

                        {/* View Map Button */}
                        <button className={styles.viewMapBtn} onClick={() => setShowMapModal(true)}>
                            📍 Click to view map
                        </button>
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {showMapModal && shipment && (
                <div className={styles.modalOverlay} onClick={() => setShowMapModal(false)}>
                    <div className={styles.mapModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setShowMapModal(false)}>×</button>
                        <h3 className={styles.modalTitle}>Tracking ID {shipment.trackingNumber}</h3>
                        <p className={styles.modalSubtitle}>Times shown are in the local time of the parcel's location</p>

                        <div className={styles.modalContent}>
                            {/* Map placeholder */}
                            <div className={styles.mapPlaceholder}>
                                <div className={styles.mapRoute}>
                                    🗺️ Route Map Visualization
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className={styles.modalTimeline}>
                                {shipment.timeline && shipment.timeline.length > 0 ? (
                                    shipment.timeline.map((event, index) => (
                                        <div key={index} className={styles.timelineItem}>
                                            <div className={styles.timelineTime}>
                                                {formatDate(event.timestamp)}
                                            </div>
                                            <div className={styles.timelineInfo}>
                                                <span className={styles.timelineStatus}>{event.status.replace('_', ' ')}</span>
                                                <span className={styles.timelineLocation}>{event.location}</span>
                                            </div>
                                            <span
                                                className={styles.timelineBadge}
                                                style={{ background: getStatusColor(event.status) }}
                                            >
                                                {event.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No tracking updates available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
