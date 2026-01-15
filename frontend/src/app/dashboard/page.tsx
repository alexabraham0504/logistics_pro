'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dashboardAPI } from '@/lib/api';
import {
    FiPackage, FiTruck, FiClock, FiAlertTriangle,
    FiCheckCircle, FiTrendingUp, FiUsers, FiBox, FiMapPin
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import styles from './page.module.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    ArcElement, Title, Tooltip, Legend, Filler
);

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    change?: string;
    color: string;
}

const StatCard = ({ icon: Icon, label, value, change, color }: StatCardProps) => (
    <div className="stat-card">
        <div className="stat-card-icon" style={{ background: color }}>
            <Icon size={24} color="white" />
        </div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {change && <div className={styles.statChange}>{change}</div>}
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                let response;
                switch (user?.role) {
                    case 'admin':
                        response = await dashboardAPI.getAdminDashboard();
                        break;
                    case 'viewer':
                        response = await dashboardAPI.getViewerDashboard();
                        break;
                    case 'customer':
                        response = await dashboardAPI.getCustomerDashboard();
                        break;
                    default:
                        return;
                }
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchDashboard();
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    // Render based on role
    if (user?.role === 'customer') {
        return <CustomerDashboard data={data} user={user} />;
    }

    if (user?.role === 'viewer') {
        return <ViewerDashboard data={data} user={user} />;
    }

    return <AdminDashboard data={data} user={user} />;
}

// Customer Dashboard
function CustomerDashboard({ data, user }: { data: any; user: any }) {
    const orderStats = data?.orderStats || {};

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Welcome back, {user?.firstName}!</h1>
                    <p>Track your orders and shipments</p>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard icon={FiPackage} label="Total Orders" value={data?.totalOrders || 0} color="linear-gradient(135deg, #0066ff 0%, #0052cc 100%)" />
                <StatCard icon={FiTruck} label="Active Shipments" value={data?.activeShipments || 0} color="linear-gradient(135deg, #00d98f 0%, #00b377 100%)" />
                <StatCard icon={FaRupeeSign} label="Pending Payments" value={`₹${(data?.pendingPayments || 0).toLocaleString()}`} color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
                <StatCard icon={FiCheckCircle} label="Delivered" value={orderStats.delivered || 0} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="mb-4">Recent Orders</h3>
                    {data?.recentOrders?.length > 0 ? (
                        <div className={styles.orderList}>
                            {data.recentOrders.map((order: any) => (
                                <div key={order._id} className={styles.orderItem}>
                                    <div className={styles.orderInfo}>
                                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                                        <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`badge badge-${getStatusColor(order.status)}`}>{order.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No orders found</p>
                    )}
                </div>

                <div className="card">
                    <h3 className="mb-4">Recent Invoices</h3>
                    {data?.recentInvoices?.length > 0 ? (
                        <div className={styles.orderList}>
                            {data.recentInvoices.map((invoice: any) => (
                                <div key={invoice._id} className={styles.orderItem}>
                                    <div className={styles.orderInfo}>
                                        <span className={styles.orderNumber}>{invoice.invoiceNumber}</span>
                                        <span className={styles.orderAmount}>₹{invoice.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <span className={`badge badge-${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No invoices found</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Viewer Dashboard
function ViewerDashboard({ data, user }: { data: any; user: any }) {
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Shipments',
            data: [65, 78, 90, 85, 92, 76, 88],
            fill: true,
            borderColor: '#0066ff',
            backgroundColor: 'rgba(0, 102, 255, 0.1)',
            tension: 0.4,
        }]
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Monitoring Dashboard</h1>
                    <p>Comprehensive view of all operations</p>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard icon={FiPackage} label="Total Orders" value={data?.orders?.total || 0} color="linear-gradient(135deg, #0066ff 0%, #0052cc 100%)" />
                <StatCard icon={FiTruck} label="In Transit" value={data?.shipments?.inTransit || 0} color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" />
                <StatCard icon={FaRupeeSign} label="Total Revenue" value={`₹${((data?.revenue?.total || 0) / 1000).toFixed(1)}K`} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
                <StatCard icon={FiTrendingUp} label="OTIF Rate" value={`${data?.kpis?.otifRate || 0}%`} color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
            </div>

            <div className="grid-2 mb-6">
                <div className="card">
                    <h3 className="mb-4">Shipments Overview</h3>
                    <div style={{ height: '250px' }}>
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="card">
                    <h3 className="mb-4">Fleet Status</h3>
                    <div className={styles.statusGrid}>
                        {data?.fleet?.stats?.map((stat: any) => (
                            <div key={stat._id} className={styles.statusItem}>
                                <span className={styles.statusValue}>{stat.count}</span>
                                <span className={styles.statusLabel}>{stat._id?.replace('_', ' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="mb-4">Recent Orders</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.orders?.recent?.map((order: any) => (
                                <tr key={order._id}>
                                    <td><strong>{order.orderNumber}</strong></td>
                                    <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                                    <td><span className={`badge badge-${getStatusColor(order.status)}`}>{order.status}</span></td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Admin Dashboard
function AdminDashboard({ data, user }: { data: any; user: any }) {
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 22000, 18000, 24000, 21000],
            fill: true,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
        }]
    };

    const alerts = data?.alerts || {};

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Admin Dashboard</h1>
                    <p>Full operational control and management</p>
                </div>
                <div className="header-actions">
                    <span className={styles.todayStats}>
                        Today: <strong>{data?.today?.orders || 0}</strong> orders,
                        <strong> ₹{(data?.today?.revenue || 0).toLocaleString()}</strong> revenue
                    </span>
                </div>
            </header>

            {/* Alerts Section */}
            {(alerts.pendingOrders > 0 || alerts.overdueInvoices > 0 || alerts.lowStockItems > 0) && (
                <div className={styles.alertsGrid}>
                    {alerts.pendingOrders > 0 && (
                        <div className={`${styles.alertCard} ${styles.alertWarning}`}>
                            <FiClock size={20} />
                            <span><strong>{alerts.pendingOrders}</strong> orders pending approval</span>
                        </div>
                    )}
                    {alerts.overdueInvoices > 0 && (
                        <div className={`${styles.alertCard} ${styles.alertError}`}>
                            <FiAlertTriangle size={20} />
                            <span><strong>{alerts.overdueInvoices}</strong> overdue invoices</span>
                        </div>
                    )}
                    {alerts.lowStockItems > 0 && (
                        <div className={`${styles.alertCard} ${styles.alertInfo}`}>
                            <FiBox size={20} />
                            <span><strong>{alerts.lowStockItems}</strong> items low in stock</span>
                        </div>
                    )}
                </div>
            )}

            <div className="stats-grid">
                <StatCard icon={FiPackage} label="Total Orders" value={data?.overall?.totalOrders || 0} color="linear-gradient(135deg, #0066ff 0%, #0052cc 100%)" />
                <StatCard icon={FaRupeeSign} label="Total Revenue" value={`₹${((data?.overall?.totalRevenue || 0) / 1000).toFixed(1)}K`} color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
                <StatCard icon={FiUsers} label="Total Users" value={data?.overall?.totalUsers || 0} color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" />
                <StatCard icon={FiTruck} label="Fleet Alerts" value={alerts.vehiclesNeedingService || 0} color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
            </div>

            <div className="grid-2 mb-6">
                <div className="card">
                    <h3 className="mb-4">Revenue Trend</h3>
                    <div style={{ height: '250px' }}>
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="card">
                    <h3 className="mb-4">Pending Approvals</h3>
                    {data?.pendingApprovals?.length > 0 ? (
                        <div className={styles.orderList}>
                            {data.pendingApprovals.map((order: any) => (
                                <div key={order._id} className={styles.orderItem}>
                                    <div className={styles.orderInfo}>
                                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                                        <span className={styles.orderDate}>{order.customer?.firstName} {order.customer?.lastName}</span>
                                    </div>
                                    <button className="btn btn-sm btn-primary">Approve</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <FiCheckCircle size={48} />
                            <p>No pending approvals</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="mb-4">Recent Orders</h3>
                    <div className="table-container" style={{ boxShadow: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.recent?.orders?.map((order: any) => (
                                    <tr key={order._id}>
                                        <td><strong>{order.orderNumber}</strong></td>
                                        <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                                        <td><span className={`badge badge-${getStatusColor(order.status)}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 className="mb-4">Active Shipments</h3>
                    {data?.recent?.shipments?.length > 0 ? (
                        <div className={styles.orderList}>
                            {data.recent.shipments.map((shipment: any) => (
                                <div key={shipment._id} className={styles.orderItem}>
                                    <div className={styles.orderInfo}>
                                        <span className={styles.orderNumber}>{shipment.trackingNumber}</span>
                                        <span className={styles.orderDate}>{shipment.currentLocation?.city || 'En route'}</span>
                                    </div>
                                    <span className={`badge badge-${getStatusColor(shipment.status)}`}>{shipment.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No active shipments</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper function
function getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
        pending: 'warning',
        approved: 'info',
        processing: 'info',
        dispatched: 'info',
        in_transit: 'primary',
        delivered: 'success',
        cancelled: 'error',
        paid: 'success',
        sent: 'info',
        overdue: 'error',
        available: 'success',
        quotation: 'warning',
    };
    return colors[status] || 'info';
}
