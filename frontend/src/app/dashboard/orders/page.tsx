'use client';

import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import styles from './orders.module.css';

interface Order {
    _id: string;
    orderNumber: string;
    customer: { firstName: string; lastName: string; company?: string };
    status: string;
    priority: string;
    totalAmount: number;
    destination: { city: string; state: string };
    createdAt: string;
}

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, statusFilter]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const params: any = { page: pagination.page, limit: pagination.limit };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;

            const response = await ordersAPI.getAll(params);
            setOrders(response.data.data.orders);
            setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders();
    };

    const handleApprove = async (id: string) => {
        if (user?.role !== 'admin') return;
        try {
            await ordersAPI.approve(id);
            fetchOrders();
        } catch (error) {
            console.error('Failed to approve order:', error);
        }
    };

    const handleCancel = async (id: string) => {
        if (user?.role !== 'admin') return;
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
            await ordersAPI.cancel(id, 'Cancelled by admin');
            fetchOrders();
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            quotation: 'warning', pending: 'warning', approved: 'info', processing: 'info',
            dispatched: 'primary', in_transit: 'primary', delivered: 'success', cancelled: 'error'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    const getPriorityBadge = (priority: string) => {
        const colors: { [key: string]: string } = { low: 'info', medium: 'warning', high: 'error', urgent: 'error' };
        return `badge badge-${colors[priority] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Orders</h1>
                    <p>Manage and track all orders</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href="/dashboard/orders/new" className="btn btn-primary">
                            <FiPlus size={18} /> New Order
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
                            placeholder="Search orders..."
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
                    <option value="quotation">Quotation</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="table-container">
                {isLoading ? (
                    <div className={styles.loadingState}>
                        <div className="spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No orders found</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Destination</th>
                                <th>Amount</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td><strong>{order.orderNumber}</strong></td>
                                    <td>
                                        {order.customer?.firstName} {order.customer?.lastName}
                                        {order.customer?.company && (
                                            <span className={styles.company}>{order.customer.company}</span>
                                        )}
                                    </td>
                                    <td>{order.destination?.city}, {order.destination?.state}</td>
                                    <td><strong>₹{order.totalAmount.toLocaleString()}</strong></td>
                                    <td><span className={getPriorityBadge(order.priority)}>{order.priority}</span></td>
                                    <td><span className={getStatusBadge(order.status)}>{order.status.replace('_', ' ')}</span></td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/dashboard/orders/${order._id}`} className={styles.actionBtn} title="View">
                                                <FiEye size={16} />
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <>
                                                    {order.status === 'pending' && (
                                                        <button onClick={() => handleApprove(order._id)} className={`${styles.actionBtn} ${styles.approveBtn}`} title="Approve">
                                                            <FiCheck size={16} />
                                                        </button>
                                                    )}
                                                    {!['delivered', 'cancelled'].includes(order.status) && (
                                                        <button onClick={() => handleCancel(order._id)} className={`${styles.actionBtn} ${styles.cancelBtn}`} title="Cancel">
                                                            <FiX size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

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
