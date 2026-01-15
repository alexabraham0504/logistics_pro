'use client';

import { useEffect, useState, useCallback } from 'react';
import { fleetAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiTruck, FiUser, FiSettings, FiAlertTriangle } from 'react-icons/fi';
import styles from './fleet.module.css';

interface Vehicle {
    _id: string;
    vehicleNumber: string;
    type: string;
    make: string;
    model: string;
    status: string;
    licensePlate: string;
    assignedDriver?: { firstName: string; lastName: string };
    currentLocation?: { address: string; city: string };
    maintenanceSchedule?: { nextService: string };
}

interface Driver {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    status: string;
    phone: string;
    license: { type: string; expiryDate: string };
    assignedVehicle?: { vehicleNumber: string };
    performance: { rating: number; totalDeliveries: number; onTimeRate: number };
}

interface FleetStats {
    vehicles: { total: number; needingService: number };
    drivers: { total: number; expiringLicenses: number };
}

export default function FleetPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [stats, setStats] = useState<FleetStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'vehicles') {
                const response = await fleetAPI.getVehicles({ limit: 50 });
                setVehicles(response.data.data.vehicles);
            } else {
                const response = await fleetAPI.getDrivers({ limit: 50 });
                setDrivers(response.data.data.drivers);
            }
            const statsResponse = await fleetAPI.getStats();
            setStats(statsResponse.data.data);
        } catch (error) {
            console.error('Failed to fetch fleet data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            available: 'success', in_transit: 'primary', maintenance: 'warning',
            out_of_service: 'error', reserved: 'info', on_duty: 'primary',
            off_duty: 'warning', on_leave: 'info', inactive: 'error'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Fleet & Assets</h1>
                    <p>Vehicle and driver management</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href={`/dashboard/fleet/${activeTab === 'vehicles' ? 'vehicles' : 'drivers'}/new`} className="btn btn-primary">
                            <FiPlus size={18} /> Add {activeTab === 'vehicles' ? 'Vehicle' : 'Driver'}
                        </Link>
                    </div>
                )}
            </header>

            {/* Stats */}
            {stats && (
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                            <FiTruck size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.vehicles?.total || 0}</div>
                        <div className="stat-card-label">Total Vehicles</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <FiUser size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.drivers?.total || 0}</div>
                        <div className="stat-card-label">Total Drivers</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                            <FiSettings size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.vehicles?.needingService || 0}</div>
                        <div className="stat-card-label">Need Service</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                            <FiAlertTriangle size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.drivers?.expiringLicenses || 0}</div>
                        <div className="stat-card-label">Expiring Licenses</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'vehicles' ? styles.activeTab : ''}`} onClick={() => setActiveTab('vehicles')}>
                    <FiTruck size={18} /> Vehicles
                </button>
                <button className={`${styles.tab} ${activeTab === 'drivers' ? styles.activeTab : ''}`} onClick={() => setActiveTab('drivers')}>
                    <FiUser size={18} /> Drivers
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className={styles.loadingState}><div className="spinner"></div></div>
            ) : activeTab === 'vehicles' ? (
                <div className={styles.grid}>
                    {vehicles.map((vehicle) => (
                        <div key={vehicle._id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardIcon}>
                                    <FiTruck size={24} />
                                </div>
                                <div>
                                    <h3>{vehicle.vehicleNumber}</h3>
                                    <span className={styles.subtext}>{vehicle.make} {vehicle.model}</span>
                                </div>
                                <span className={getStatusBadge(vehicle.status)}>{vehicle.status.replace('_', ' ')}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span>Type:</span>
                                    <span className={styles.capitalize}>{vehicle.type}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Plate:</span>
                                    <span>{vehicle.licensePlate}</span>
                                </div>
                                {vehicle.assignedDriver && (
                                    <div className={styles.infoRow}>
                                        <span>Driver:</span>
                                        <span>{vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardFooter}>
                                <Link href={`/dashboard/fleet/vehicles/${vehicle._id}`} className="btn btn-sm btn-ghost">View</Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {drivers.map((driver) => (
                        <div key={driver._id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardIcon}>
                                    <FiUser size={24} />
                                </div>
                                <div>
                                    <h3>{driver.firstName} {driver.lastName}</h3>
                                    <span className={styles.subtext}>{driver.employeeId}</span>
                                </div>
                                <span className={getStatusBadge(driver.status)}>{driver.status.replace('_', ' ')}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span>License:</span>
                                    <span>{driver.license?.type}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Deliveries:</span>
                                    <span>{driver.performance?.totalDeliveries}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>On-Time:</span>
                                    <span>{driver.performance?.onTimeRate}%</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <Link href={`/dashboard/fleet/drivers/${driver._id}`} className="btn btn-sm btn-ghost">View</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
