'use client';

import { useEffect, useState, use } from 'react';
import { ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPrinter, FiEdit, FiCheck, FiX, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import styles from './order-details.module.css';

interface OrderDetailsProps {
    params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: OrderDetailsProps) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await ordersAPI.getById(id);
                setOrder(response.data.data.order);
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleStatusUpdate = async (status: string) => {
        try {
            await ordersAPI.update(id, { status });
            // Refresh
            const response = await ordersAPI.getById(id);
            setOrder(response.data.data.order);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (isLoading) return <div className="loading-state"><div className="spinner"></div></div>;
    if (!order) return <div className="error-state">Order not found</div>;

    const getStatusColor = (status: string) => {
        const colors: any = {
            pending: 'warning', approved: 'info', processing: 'primary',
            dispatched: 'indigo', delivered: 'success', cancelled: 'error'
        };
        return colors[status] || 'gray';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
                        <FiArrowLeft /> Back
                    </button>
                    <h1>Order {order.orderNumber}</h1>
                    <span className={`badge badge-${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                    </span>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <FiPrinter /> Print
                    </button>
                    {order.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate('approved')} className="btn btn-success">
                            <FiCheck /> Approve
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.mainContent}>
                    {/* Items */}
                    <div className={styles.card}>
                        <h3>Order Items</h3>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>
                                            <div className={styles.itemName}>{item.name}</div>
                                            <div className={styles.itemSku}>{item.sku}</div>
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.unitPrice}</td>
                                        <td>₹{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="text-right"><strong>Total:</strong></td>
                                    <td><strong>₹{order.totalAmount}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Timeline/History would go here */}
                </div>

                <div className={styles.sidebar}>
                    {/* Customer Info */}
                    <div className={styles.card}>
                        <h3>Customer</h3>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Name</span>
                            <span className={styles.value}>{order.customer?.firstName} {order.customer?.lastName}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Email</span>
                            <span className={styles.value}>{order.customer?.email}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Company</span>
                            <span className={styles.value}>{order.customer?.company || '-'}</span>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className={styles.card}>
                        <h3>Destination</h3>
                        <div className={styles.address}>
                            <FiMapPin className={styles.icon} />
                            <div>
                                <p>{order.destination?.address}</p>
                                <p>{order.destination?.city}, {order.destination?.state}</p>
                                <p>{order.destination?.zipCode}</p>
                                <p>{order.destination?.country}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipment Status */}
                    {order.shipment ? (
                        <div className={styles.card}>
                            <h3>Shipment</h3>
                            <div className={styles.shipmentInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Tracking</span>
                                    <Link href={`/dashboard/tracking?number=${order.shipment.trackingNumber}`} className={styles.link}>
                                        {order.shipment.trackingNumber}
                                    </Link>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Status</span>
                                    <span>{order.shipment.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                    ) : order.status !== 'pending' && order.status !== 'cancelled' ? (
                        <div className={styles.card}>
                            <button className="btn btn-primary btn-full">
                                <FiTruck /> Create Shipment
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
