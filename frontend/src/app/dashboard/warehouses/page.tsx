'use client';

import { useEffect, useState } from 'react';
import { warehousesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiArchive, FiMapPin, FiBox, FiPercent } from 'react-icons/fi';
import styles from './warehouses.module.css';

interface Warehouse {
    _id: string;
    name: string;
    code: string;
    type: string;
    address: { city: string; state: string; country: string };
    capacity: { total: number; used: number; unit: string };
    status: string;
    utilizationPercentage: number;
}

export default function WarehousesPage() {
    const { user } = useAuth();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchWarehouses();
        fetchStats();
    }, []);

    const fetchWarehouses = async () => {
        try {
            const response = await warehousesAPI.getAll({ limit: 50 });
            setWarehouses(response.data.data.warehouses);
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await warehousesAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 90) return '#ef4444';
        if (percentage >= 70) return '#f59e0b';
        return '#10b981';
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            active: 'success', inactive: 'error', maintenance: 'warning', closed: 'error'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Warehouses</h1>
                    <p>Multi-location warehouse management</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href="/dashboard/warehouses/new" className="btn btn-primary">
                            <FiPlus size={18} /> Add Warehouse
                        </Link>
                    </div>
                )}
            </header>

            {/* Stats */}
            {stats && (
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                            <FiArchive size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.totalWarehouses}</div>
                        <div className="stat-card-label">Total Warehouses</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <FiBox size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.totalCapacity?.toLocaleString()}</div>
                        <div className="stat-card-label">Total Capacity</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                            <FiPercent size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.avgUtilization}%</div>
                        <div className="stat-card-label">Avg Utilization</div>
                    </div>
                </div>
            )}

            {/* Warehouses Grid */}
            {isLoading ? (
                <div className={styles.loadingState}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className={styles.warehouseGrid}>
                    {warehouses.map((warehouse) => (
                        <div key={warehouse._id} className={styles.warehouseCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.warehouseName}>{warehouse.name}</h3>
                                    <span className={styles.warehouseCode}>{warehouse.code}</span>
                                </div>
                                <span className={getStatusBadge(warehouse.status)}>{warehouse.status}</span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <FiMapPin size={14} />
                                    <span>{warehouse.address?.city}, {warehouse.address?.state}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <FiArchive size={14} />
                                    <span className={styles.warehouseType}>{warehouse.type?.replace('_', ' ')}</span>
                                </div>

                                <div className={styles.utilizationSection}>
                                    <div className={styles.utilizationHeader}>
                                        <span>Utilization</span>
                                        <span style={{ color: getUtilizationColor(warehouse.utilizationPercentage || 0) }}>
                                            {warehouse.utilizationPercentage || 0}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${warehouse.utilizationPercentage || 0}%`,
                                                background: getUtilizationColor(warehouse.utilizationPercentage || 0)
                                            }}
                                        ></div>
                                    </div>
                                    <div className={styles.capacityInfo}>
                                        <span>{warehouse.capacity?.used?.toLocaleString() || 0} / {warehouse.capacity?.total?.toLocaleString() || 0}</span>
                                        <span>{warehouse.capacity?.unit?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <Link href={`/dashboard/warehouses/${warehouse._id}`} className="btn btn-sm btn-ghost">
                                    View Details
                                </Link>
                                {user?.role === 'admin' && (
                                    <Link href={`/dashboard/warehouses/${warehouse._id}/edit`} className="btn btn-sm btn-outline">
                                        Edit
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
