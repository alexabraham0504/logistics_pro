'use client';

import { useEffect, useState } from 'react';
import { invoicesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEye, FiDownload, FiMail, FiCreditCard } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import styles from './invoices.module.css';

interface Invoice {
    _id: string;
    invoiceNumber: string;
    customer: { firstName: string; lastName: string; company?: string };
    order: { orderNumber: string };
    status: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    issueDate: string;
    dueDate: string;
}

export default function InvoicesPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
        if (user?.role !== 'customer') fetchStats();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        try {
            const params: any = { limit: 50 };
            if (statusFilter) params.status = statusFilter;
            const response = await invoicesAPI.getAll(params);
            setInvoices(response.data.data.invoices);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await invoicesAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            draft: 'info', pending: 'warning', sent: 'info', paid: 'success',
            partial: 'warning', overdue: 'error', cancelled: 'error', refunded: 'info'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>{user?.role === 'customer' ? 'My Invoices' : 'Invoices'}</h1>
                    <p>Billing and payment management</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href="/dashboard/invoices/new" className="btn btn-primary">
                            <FiPlus size={18} /> Create Invoice
                        </Link>
                    </div>
                )}
            </header>

            {/* Stats - Admin/Viewer only */}
            {stats && (
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <FaRupeeSign size={24} color="white" />
                        </div>
                        <div className="stat-card-value">₹{(stats.totalRevenue / 1000).toFixed(1)}K</div>
                        <div className="stat-card-label">Total Revenue</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                            <FiCreditCard size={24} color="white" />
                        </div>
                        <div className="stat-card-value">₹{(stats.pendingAmount / 1000).toFixed(1)}K</div>
                        <div className="stat-card-label">Pending Amount</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                            <FiMail size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.totalInvoices}</div>
                        <div className="stat-card-label">Total Invoices</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className={styles.filters}>
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: '180px' }}
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>

            {/* Invoices Table */}
            <div className="table-container">
                {isLoading ? (
                    <div className={styles.loadingState}><div className="spinner"></div></div>
                ) : invoices.length === 0 ? (
                    <div className={styles.emptyState}><p>No invoices found</p></div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                {user?.role !== 'customer' && <th>Customer</th>}
                                <th>Order</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Due</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice._id}>
                                    <td><strong>{invoice.invoiceNumber}</strong></td>
                                    {user?.role !== 'customer' && (
                                        <td>
                                            {invoice.customer?.firstName} {invoice.customer?.lastName}
                                            {invoice.customer?.company && <span className={styles.company}>{invoice.customer.company}</span>}
                                        </td>
                                    )}
                                    <td>{invoice.order?.orderNumber}</td>
                                    <td><strong>₹{invoice.totalAmount.toLocaleString()}</strong></td>
                                    <td className={styles.paid}>₹{invoice.amountPaid.toLocaleString()}</td>
                                    <td className={invoice.amountDue > 0 ? styles.due : ''}>₹{invoice.amountDue.toLocaleString()}</td>
                                    <td><span className={getStatusBadge(invoice.status)}>{invoice.status}</span></td>
                                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/dashboard/invoices/${invoice._id}`} className={styles.actionBtn} title="View">
                                                <FiEye size={16} />
                                            </Link>
                                            <button className={styles.actionBtn} title="Download">
                                                <FiDownload size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
