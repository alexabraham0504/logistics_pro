'use client';

import { useState } from 'react';
import { shipmentsAPI } from '@/lib/api';
import { FiSearch, FiMapPin, FiPackage, FiTruck, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';
import styles from './tracking.module.css';

interface TrackingData {
    trackingNumber: string;
    status: string;
    currentLocation: { city: string; state: string };
    estimatedDelivery: string;
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    trackingHistory: Array<{
        status: string;
        description: string;
        timestamp: string;
        location?: { city: string };
    }>;
    delayInfo?: { isDelayed: boolean; reason: string };
}

export default function TrackingPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;

        setIsLoading(true);
        setError('');
        setTrackingData(null);

        try {
            const response = await shipmentsAPI.track(trackingNumber.trim());
            setTrackingData(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Shipment not found');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <FiCheck />;
            case 'in_transit': return <FiTruck />;
            case 'out_for_delivery': return <FiTruck />;
            case 'pending': return <FiClock />;
            default: return <FiPackage />;
        }
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Track Shipment</h1>
                    <p>Real-time shipment tracking</p>
                </div>
            </header>

            {/* Search Form */}
            <div className={styles.searchCard}>
                <form onSubmit={handleTrack} className={styles.searchForm}>
                    <div className={styles.searchInputWrapper}>
                        <FiSearch size={20} />
                        <input
                            type="text"
                            placeholder="Enter tracking number (e.g., SHP2026ABC123)"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
                        {isLoading ? 'Tracking...' : 'Track'}
                    </button>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div className={styles.error}>
                    <FiAlertTriangle />
                    <span>{error}</span>
                </div>
            )}

            {/* Tracking Results */}
            {trackingData && (
                <div className={styles.trackingResults}>
                    {/* Status Header */}
                    <div className={styles.statusHeader}>
                        <div className={styles.statusIcon}>
                            {getStatusIcon(trackingData.status)}
                        </div>
                        <div className={styles.statusInfo}>
                            <h2>{trackingData.trackingNumber}</h2>
                            <span className={`badge badge-${trackingData.status === 'delivered' ? 'success' : 'primary'}`}>
                                {trackingData.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Delay Alert */}
                    {trackingData.delayInfo?.isDelayed && (
                        <div className={styles.delayAlert}>
                            <FiAlertTriangle />
                            <span>Shipment Delayed: {trackingData.delayInfo.reason}</span>
                        </div>
                    )}

                    {/* Route Info */}
                    <div className={styles.routeInfo}>
                        <div className={styles.routePoint}>
                            <span className={styles.routeLabel}>From</span>
                            <span className={styles.routeValue}>{trackingData.origin?.city}, {trackingData.origin?.state}</span>
                        </div>
                        <div className={styles.routeLine}>
                            <div className={styles.routeProgress}></div>
                        </div>
                        <div className={styles.routePoint}>
                            <span className={styles.routeLabel}>Current Location</span>
                            <span className={styles.routeValue}>
                                {trackingData.currentLocation?.city
                                    ? `${trackingData.currentLocation.city}, ${trackingData.currentLocation.state}`
                                    : 'Updating...'
                                }
                            </span>
                        </div>
                        <div className={styles.routeLine}>
                            <div className={styles.routeProgress} style={{ width: '0%' }}></div>
                        </div>
                        <div className={styles.routePoint}>
                            <span className={styles.routeLabel}>To</span>
                            <span className={styles.routeValue}>{trackingData.destination?.city}, {trackingData.destination?.state}</span>
                        </div>
                    </div>

                    {/* ETA */}
                    <div className={styles.etaCard}>
                        <FiClock size={20} />
                        <div>
                            <span className={styles.etaLabel}>Estimated Delivery</span>
                            <span className={styles.etaValue}>
                                {trackingData.estimatedDelivery
                                    ? new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })
                                    : 'To be determined'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Tracking History */}
                    <div className={styles.historyCard}>
                        <h3>Tracking History</h3>
                        <div className={styles.timeline}>
                            {trackingData.trackingHistory?.map((event, index) => (
                                <div key={index} className={styles.timelineItem}>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineStatus}>{event.status.replace('_', ' ')}</span>
                                        <span className={styles.timelineDesc}>{event.description}</span>
                                        <span className={styles.timelineTime}>
                                            {new Date(event.timestamp).toLocaleString()}
                                            {event.location?.city && ` - ${event.location.city}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
