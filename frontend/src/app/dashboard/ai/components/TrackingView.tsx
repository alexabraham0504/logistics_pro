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

export default function TrackingView() {
    const { token } = useAuth();
    const [trackingId, setTrackingId] = useState('');
    const [shipment, setShipment] = useState<ShipmentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async () => {
        if (!trackingId.trim()) {
            setError('Please enter a tracking number');
            return;
        }

        setLoading(true);
        setError('');

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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return '#00d26a';
            case 'in_transit': return '#ff8c00';
            case 'picked_up': return '#00b4d8';
            case 'pending': return '#888';
            default: return '#ff8c00';
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

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>📍</span>
                    <h1>Shipment Tracker</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>Live Tracking</span>
                </div>
            </header>

            <div className={styles.content}>
                {/* Search Section */}
                <section className={styles.searchSection}>
                    <h2 className={styles.sectionTitle}>Track Your Shipment</h2>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Enter Tracking Number (e.g., SHIP-001)"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                            className={styles.searchInput}
                        />
                        <button
                            onClick={handleTrack}
                            disabled={loading}
                            className={styles.searchBtn}
                        >
                            {loading ? 'Tracking...' : 'Track'}
                        </button>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                </section>

                {/* Results */}
                {shipment && (
                    <div className={styles.resultsGrid}>
                        {/* Map Visualization */}
                        <section className={styles.mapSection}>
                            <h3 className={styles.mapTitle}>Route Visualization</h3>
                            <div className={styles.mapPlaceholder}>
                                <div className={styles.mapRoute}>
                                    <div className={styles.routePoint + ' ' + styles.origin}>
                                        <span>📦</span>
                                        <p>Origin</p>
                                        <small>{shipment.origin?.address || 'Warehouse'}</small>
                                    </div>
                                    <div className={styles.routeLine}>
                                        <div
                                            className={styles.routeProgress}
                                            style={{
                                                width: shipment.status === 'delivered' ? '100%' :
                                                    shipment.status === 'in_transit' ? '60%' : '20%'
                                            }}
                                        ></div>
                                        {shipment.status === 'in_transit' && (
                                            <div className={styles.currentLocation}>
                                                <span>🚛</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.routePoint + ' ' + styles.destination}>
                                        <span>🏠</span>
                                        <p>Destination</p>
                                        <small>{shipment.destination?.address || 'Customer'}</small>
                                    </div>
                                </div>
                                <div className={styles.mapOverlay}>
                                    <p>Interactive Map Coming Soon</p>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className={styles.timelineSection}>
                            <h3 className={styles.timelineTitle}>Shipment Timeline</h3>

                            <div className={styles.shipmentInfo}>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>Tracking #</span>
                                    <span className={styles.infoValue}>{shipment.trackingNumber}</span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ background: getStatusColor(shipment.status) }}
                                    >
                                        {shipment.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles.infoCard}>
                                    <span className={styles.infoLabel}>ETA</span>
                                    <span className={styles.infoValue}>
                                        {shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery) : 'Calculating...'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.timeline}>
                                {shipment.timeline && shipment.timeline.length > 0 ? (
                                    shipment.timeline.map((event, index) => (
                                        <div key={index} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} style={{ background: getStatusColor(event.status) }}></div>
                                            <div className={styles.timelineContent}>
                                                <h4>{event.status.replace('_', ' ')}</h4>
                                                <p>{event.location}</p>
                                                <time>{formatDate(event.timestamp)}</time>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noTimeline}>
                                        <p>No tracking updates yet</p>
                                        <small>Updates will appear as shipment progresses</small>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* Empty State */}
                {!shipment && !loading && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📦</div>
                        <h3>Enter a Tracking Number</h3>
                        <p>Track your shipment in real-time with live updates and timeline visualization</p>
                        <div className={styles.sampleNumbers}>
                            <p>Sample: <code>SHIP-001</code>, <code>SHIP-002</code></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
