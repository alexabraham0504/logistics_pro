'use client';

import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPackage, FiMapPin, FiCalendar } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import styles from './my-orders.module.css';

interface Order {
    _id: string;
    orderNumber: string;
    status: string;
    priority: string;
    totalAmount: number;
    destination: { city: string; state: string };
    estimatedDeliveryDate: string;
    actualDeliveryDate?: string;
    createdAt: string;
    shipment?: { trackingNumber: string; status: string };
}

export default function MyOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const params: any = { limit: 50 };
            if (statusFilter) params.status = statusFilter;
            const response = await ordersAPI.getAll(params);
            setOrders(response.data.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            quotation: 'warning', pending: 'warning', approved: 'info', processing: 'info',
            dispatched: 'primary', in_transit: 'primary', delivered: 'success', cancelled: 'error'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    const getStatusStep = (status: string) => {
        const steps = ['pending', 'approved', 'processing', 'dispatched', 'in_transit', 'delivered'];
        return steps.indexOf(status) + 1;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>My Orders</h1>
                    <p>View and track your orders</p>
                </div>
            </header>

            {/* Filter */}
            <div className={styles.filters}>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '180px' }}>
                    <option value="">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>

            {/* Orders */}
            {isLoading ? (
                <div className={styles.loadingState}><div className="spinner"></div></div>
            ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiPackage size={48} />
                    <p>No orders found</p>
                </div>
            ) : (
                <div className={styles.ordersGrid}>
                    {orders.map((order) => (
                        <div key={order._id} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <div>
                                    <h3 className={styles.orderNumber}>{order.orderNumber}</h3>
                                    <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className={getStatusBadge(order.status)}>{order.status.replace('_', ' ')}</span>
                            </div>

                            {/* Progress Steps */}
                            {!['cancelled', 'quotation'].includes(order.status) && (
                                <div className={styles.progressSteps}>
                                    {['Pending', 'Approved', 'Processing', 'In Transit', 'Delivered'].map((step, index) => (
                                        <div key={step} className={`${styles.step} ${index < getStatusStep(order.status) ? styles.completed : ''}`}>
                                            <div className={styles.stepDot}></div>
                                            <span className={styles.stepLabel}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.orderDetails}>
                                <div className={styles.detailRow}>
                                    <FiMapPin size={14} />
                                    <span>{order.destination?.city}, {order.destination?.state}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <FiCalendar size={14} />
                                    <span>
                                        {order.status === 'delivered'
                                            ? `Delivered: ${new Date(order.actualDeliveryDate || '').toLocaleDateString()}`
                                            : `ETA: ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}`
                                        }
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <FaRupeeSign size={14} />
                                    <span>₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className={styles.orderFooter}>
                                {order.shipment?.trackingNumber && (
                                    <Link href={`/dashboard/tracking?number=${order.shipment.trackingNumber}`} className="btn btn-sm btn-outline">
                                        Track Shipment
                                    </Link>
                                )}
                                <Link href={`/dashboard/orders/${order._id}`} className="btn btn-sm btn-ghost">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
