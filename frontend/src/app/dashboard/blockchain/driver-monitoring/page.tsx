'use client';

import { useState, useEffect, useCallback } from 'react';
import { blackbugAPI, fleetAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiArrowLeft, FiUser, FiActivity, FiShield, FiTruck,
    FiAlertTriangle, FiCheckCircle, FiClock, FiHash, FiLink,
    FiZap, FiTrendingUp, FiMap
} from 'react-icons/fi';
import styles from './monitoring.module.css';

interface Driver {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    status: string;
    behaviorMonitoring?: {
        tripCount?: number;
        totalDistance?: number;
        harshBrakingEvents?: number;
        harshAccelerationEvents?: number;
        overspeedingInstances?: number;
        averageSpeed?: number;
        blockchainHash?: string;
    };
    blockchainProfile?: {
        blockchainRecordCount?: number;
        verificationStatus?: string;
    };
}

interface DriverMonitoringData {
    driver: {
        id: string;
        name: string;
        employeeId: string;
    };
    behaviorMetrics: Driver['behaviorMonitoring'];
    safetyScore: number;
    blockchainStatus: {
        totalRecords: number;
        lastUpdate: string;
        lastHash: string;
    };
}

interface BlockchainRecord {
    _id: string;
    eventType: string;
    eventData: {
        timestamp: string;
        speed?: number;
        distance?: number;
    };
    blockchainData: {
        hash: string;
        previousHash: string;
        blockNumber: number;
        timestamp: string;
    };
}

export default function DriverMonitoringPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [monitoringData, setMonitoringData] = useState<DriverMonitoringData | null>(null);
    const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDriver, setIsLoadingDriver] = useState(false);

    const fetchDrivers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fleetAPI.getDrivers({ limit: 50 });
            setDrivers(response.data.data.drivers || []);
        } catch (err) {
            console.error('Failed to fetch drivers:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const selectDriver = async (driverId: string) => {
        setSelectedDriver(driverId);
        setIsLoadingDriver(true);

        try {
            const [monitoringRes, blockchainRes] = await Promise.all([
                blackbugAPI.getDriverMonitoring(driverId),
                blackbugAPI.getDriverBlockchain(driverId, { limit: 10 })
            ]);

            setMonitoringData(monitoringRes.data.data);
            setBlockchainRecords(blockchainRes.data.data.blockchainRecords || []);
        } catch (err) {
            console.error('Failed to fetch driver data:', err);
        } finally {
            setIsLoadingDriver(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '-';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
    };

    const getSafetyScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getEventTypeLabel = (eventType: string) => {
        const labels: Record<string, string> = {
            trip_start: 'Trip Started',
            trip_end: 'Trip Completed',
            harsh_braking: 'Harsh Braking',
            harsh_acceleration: 'Harsh Acceleration',
            overspeeding: 'Overspeeding',
            behavior_update: 'Behavior Update'
        };
        return labels[eventType] || eventType;
    };

    const getEventTypeIcon = (eventType: string) => {
        switch (eventType) {
            case 'trip_start':
            case 'trip_end':
                return <FiTruck size={16} />;
            case 'harsh_braking':
            case 'harsh_acceleration':
                return <FiAlertTriangle size={16} />;
            case 'overspeeding':
                return <FiZap size={16} />;
            default:
                return <FiActivity size={16} />;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/blockchain" className={styles.backBtn}>
                    <FiArrowLeft size={20} />
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiActivity size={32} />
                    </div>
                    <div>
                        <h1>Driver Monitoring</h1>
                        <p>Blackbug behavior tracking with blockchain verification</p>
                    </div>
                </div>
            </header>

            <div className={styles.mainGrid}>
                {/* Driver List */}
                <div className={styles.driverList}>
                    <h3>Select Driver</h3>
                    {isLoading ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiUser size={32} />
                            <p>No drivers found</p>
                        </div>
                    ) : (
                        <div className={styles.driverGrid}>
                            {drivers.map((driver) => (
                                <button
                                    key={driver._id}
                                    className={`${styles.driverCard} ${selectedDriver === driver._id ? styles.selected : ''}`}
                                    onClick={() => selectDriver(driver._id)}
                                >
                                    <div className={styles.driverAvatar}>
                                        {driver.firstName.charAt(0)}{driver.lastName.charAt(0)}
                                    </div>
                                    <div className={styles.driverInfo}>
                                        <span className={styles.driverName}>
                                            {driver.firstName} {driver.lastName}
                                        </span>
                                        <span className={styles.driverEmpId}>
                                            {driver.employeeId}
                                        </span>
                                    </div>
                                    <span className={`${styles.statusDot} ${styles[driver.status]}`}></span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Driver Details */}
                <div className={styles.driverDetails}>
                    {!selectedDriver ? (
                        <div className={styles.selectPrompt}>
                            <FiUser size={48} />
                            <h3>Select a driver</h3>
                            <p>Choose a driver from the list to view monitoring data</p>
                        </div>
                    ) : isLoadingDriver ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : monitoringData ? (
                        <>
                            {/* Driver Header */}
                            <div className={styles.detailsHeader}>
                                <div className={styles.driverHeaderInfo}>
                                    <h2>{monitoringData.driver.name}</h2>
                                    <span>{monitoringData.driver.employeeId}</span>
                                </div>
                                <div
                                    className={styles.safetyScore}
                                    style={{ borderColor: getSafetyScoreColor(monitoringData.safetyScore) }}
                                >
                                    <span
                                        className={styles.scoreValue}
                                        style={{ color: getSafetyScoreColor(monitoringData.safetyScore) }}
                                    >
                                        {monitoringData.safetyScore}
                                    </span>
                                    <span className={styles.scoreLabel}>Safety Score</span>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className={styles.metricsGrid}>
                                <div className={styles.metricCard}>
                                    <FiTruck className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {monitoringData.behaviorMetrics?.tripCount || 0}
                                    </span>
                                    <span className={styles.metricLabel}>Total Trips</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <FiMap className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {(monitoringData.behaviorMetrics?.totalDistance || 0).toFixed(1)} km
                                    </span>
                                    <span className={styles.metricLabel}>Distance</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <FiTrendingUp className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {(monitoringData.behaviorMetrics?.averageSpeed || 0).toFixed(1)} km/h
                                    </span>
                                    <span className={styles.metricLabel}>Avg Speed</span>
                                </div>
                                <div className={`${styles.metricCard} ${styles.warning}`}>
                                    <FiAlertTriangle className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {(monitoringData.behaviorMetrics?.harshBrakingEvents || 0) +
                                            (monitoringData.behaviorMetrics?.harshAccelerationEvents || 0)}
                                    </span>
                                    <span className={styles.metricLabel}>Harsh Events</span>
                                </div>
                                <div className={`${styles.metricCard} ${styles.danger}`}>
                                    <FiZap className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {monitoringData.behaviorMetrics?.overspeedingInstances || 0}
                                    </span>
                                    <span className={styles.metricLabel}>Overspeeding</span>
                                </div>
                                <div className={`${styles.metricCard} ${styles.blockchain}`}>
                                    <FiLink className={styles.metricIcon} />
                                    <span className={styles.metricValue}>
                                        {monitoringData.blockchainStatus?.totalRecords || 0}
                                    </span>
                                    <span className={styles.metricLabel}>Blockchain Records</span>
                                </div>
                            </div>

                            {/* Blockchain Records */}
                            <div className={styles.blockchainSection}>
                                <h3>
                                    <FiShield size={18} />
                                    Blockchain Activity
                                </h3>
                                {blockchainRecords.length === 0 ? (
                                    <div className={styles.noRecords}>
                                        <p>No blockchain records yet</p>
                                    </div>
                                ) : (
                                    <div className={styles.recordsList}>
                                        {blockchainRecords.map((record) => (
                                            <div key={record._id} className={styles.recordItem}>
                                                <div className={styles.recordIcon}>
                                                    {getEventTypeIcon(record.eventType)}
                                                </div>
                                                <div className={styles.recordInfo}>
                                                    <span className={styles.recordType}>
                                                        {getEventTypeLabel(record.eventType)}
                                                    </span>
                                                    <span className={styles.recordTime}>
                                                        {formatDate(record.eventData?.timestamp)}
                                                    </span>
                                                </div>
                                                <div className={styles.recordBlockchain}>
                                                    <span className={styles.blockNumber}>
                                                        #{record.blockchainData.blockNumber}
                                                    </span>
                                                    <code className={styles.hashCode}>
                                                        {truncateHash(record.blockchainData.hash)}
                                                    </code>
                                                </div>
                                                <FiCheckCircle className={styles.verifiedIcon} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
