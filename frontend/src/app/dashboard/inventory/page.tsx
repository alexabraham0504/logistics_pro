'use client';

import { useEffect, useState } from 'react';
import { inventoryAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiPlus, FiSearch, FiBox, FiAlertTriangle, FiEye, FiEdit } from 'react-icons/fi';
import styles from './inventory.module.css';

interface InventoryItem {
    _id: string;
    sku: string;
    name: string;
    category: string;
    warehouse: { name: string; code: string };
    quantity: { onHand: number; available: number; reserved: number };
    status: string;
    unitCost: number;
    unitPrice: number;
    reorderPoint: number;
}

export default function InventoryPage() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        fetchInventory();
        fetchStats();
    }, [statusFilter, categoryFilter]);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            const params: any = { limit: 100 };
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (search) params.search = search;

            const response = await inventoryAPI.getAll(params);
            setInventory(response.data.data.items);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await inventoryAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: { [key: string]: string } = {
            in_stock: 'success', low_stock: 'warning', out_of_stock: 'error',
            discontinued: 'error', on_order: 'info'
        };
        return `badge badge-${colors[status] || 'info'}`;
    };

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Inventory</h1>
                    <p>Stock level monitoring and control</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="header-actions">
                        <Link href="/dashboard/inventory/new" className="btn btn-primary">
                            <FiPlus size={18} /> Add Item
                        </Link>
                    </div>
                )}
            </header>

            {/* Stats */}
            {stats && (
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                            <FiBox size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.totalItems}</div>
                        <div className="stat-card-label">Total Items</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <FiBox size={24} color="white" />
                        </div>
                        <div className="stat-card-value">₹{(stats.totalValue / 1000).toFixed(1)}K</div>
                        <div className="stat-card-label">Total Value</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                            <FiAlertTriangle size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.lowStockCount}</div>
                        <div className="stat-card-label">Low Stock</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                            <FiAlertTriangle size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.outOfStockCount}</div>
                        <div className="stat-card-label">Out of Stock</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchInput}>
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by SKU or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                    />
                </div>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
                    <option value="">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                </select>
            </div>

            {/* Inventory Table */}
            <div className="table-container">
                {isLoading ? (
                    <div className={styles.loadingState}><div className="spinner"></div></div>
                ) : inventory.length === 0 ? (
                    <div className={styles.emptyState}><p>No inventory items found</p></div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Warehouse</th>
                                <th>Available</th>
                                <th>Reserved</th>
                                <th>On Hand</th>
                                <th>Status</th>
                                <th>Unit Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item) => (
                                <tr key={item._id} className={item.status === 'low_stock' || item.status === 'out_of_stock' ? styles.alertRow : ''}>
                                    <td><strong className={styles.sku}>{item.sku}</strong></td>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td><span className={styles.warehouse}>{item.warehouse?.name}</span></td>
                                    <td className={item.quantity.available <= item.reorderPoint ? styles.lowStock : ''}>{item.quantity.available}</td>
                                    <td>{item.quantity.reserved}</td>
                                    <td>{item.quantity.onHand}</td>
                                    <td><span className={getStatusBadge(item.status)}>{item.status.replace('_', ' ')}</span></td>
                                    <td>₹{item.unitPrice}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/dashboard/inventory/${item._id}`} className={styles.actionBtn}><FiEye size={16} /></Link>
                                            {user?.role === 'admin' && (
                                                <Link href={`/dashboard/inventory/${item._id}/edit`} className={styles.actionBtn}><FiEdit size={16} /></Link>
                                            )}
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
