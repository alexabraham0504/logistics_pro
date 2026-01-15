'use client';

import { useEffect, useState } from 'react';
import { shipmentsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiSearch, FiMapPin, FiEye, FiEdit, FiTruck, FiClock, FiAlertTriangle } from 'react-icons/fi';
import styles from './shipments.module.css';

interface Shipment {
    _id: string;
    trackingNumber: string;
    order: { orderNumber: string };
    status: string;
    carrier: { name: string };
    destination: { city: string; state: string };
    estimatedDelivery: string;
    currentLocation?: { city: string; state: string };
    delayInfo?: { isDelayed: boolean; reason: string };
    createdAt: string;
}

export default function ShipmentsPage() {
    const { user } = useAuth();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    useEffect(() => {
        fetchShipments();
    }, [pagination.page, statusFilter]);

    const fetchShipments = async () => {
        try {
            setIsLoading(true);
            const params: any = { page: pagination.page, limit: pagination.limit };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const response = await shipmentsAPI.getAll(params);
            setShipments(response.data.data.shipments);
            setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchShipments();
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            pending: 'warning', picked_up: 'info', in_transit: 'primary',
            out_for_delivery: 'info', delivered: 'success', failed_delivery: 'error',
            returned: 'error', cancelled: 'error'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Shipments</h1>
                    <p>Track and manage all shipments</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href="/dashboard/shipments/new" className="btn btn-primary">
                            <FiPlus size={18} /> New Shipment
                        </Link>
                    </div>
                )}
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.searchInput}>
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search by tracking number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Search</button>
                </form>
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: '180px' }}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed_delivery">Failed Delivery</option>
                </select>
            </div>

            {/* Shipments Grid */}
            {isLoading ? (
                <div className={styles.loadingState}>
                    <div className="spinner"></div>
                    <p>Loading shipments...</p>
                </div>
            ) : shipments.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiTruck size={48} />
                    <p>No shipments found</p>
                </div>
            ) : (
                <div className={styles.shipmentsGrid}>
                    {shipments.map((shipment) => (
                        <div key={shipment._id} className={styles.shipmentCard}>
                            <div className={styles.shipmentHeader}>
                                <span className={styles.trackingNumber}>{shipment.trackingNumber}</span>
                                <span className={getStatusBadge(shipment.status)}>
                                    {shipment.status.replace('_', ' ')}
                                </span>
                            </div>

                            {shipment.delayInfo?.isDelayed && (
                                <div className={styles.delayAlert}>
                                    <FiAlertTriangle size={14} />
                                    <span>Delayed: {shipment.delayInfo.reason}</span>
                                </div>
                            )}

                            <div className={styles.shipmentDetails}>
                                <div className={styles.detailRow}>
                                    <FiMapPin size={14} />
                                    <span>
                                        {shipment.currentLocation?.city
                                            ? `${shipment.currentLocation.city}, ${shipment.currentLocation.state}`
                                            : 'Location updating...'
                                        }
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <FiTruck size={14} />
                                    <span>To: {shipment.destination?.city}, {shipment.destination?.state}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <FiClock size={14} />
                                    <span>ETA: {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'TBD'}</span>
                                </div>
                            </div>

                            <div className={styles.shipmentFooter}>
                                <span className={styles.orderRef}>Order: {shipment.order?.orderNumber}</span>
                                <Link href={`/dashboard/shipments/${shipment._id}`} className="btn btn-sm btn-ghost">
                                    <FiEye size={14} /> View
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className="btn btn-ghost"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button
                        className="btn btn-ghost"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
