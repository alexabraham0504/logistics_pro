'use client';

import { useEffect, useState } from 'react';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiSearch, FiUsers, FiEdit, FiTrash2, FiCheck, FiX, FiShield } from 'react-icons/fi';
import styles from './users.module.css';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: string;
    company?: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        if (currentUser?.role !== 'admin') return;
        fetchUsers();
        fetchStats();
    }, [roleFilter, currentUser]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const params: any = { limit: 100 };
            if (roleFilter) params.role = roleFilter;
            if (search) params.search = search;

            const response = await usersAPI.getAll(params);
            setUsers(response.data.data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await usersAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await usersAPI.delete(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to deactivate user:', error);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await usersAPI.activate(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to activate user:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: { [key: string]: string } = {
            admin: 'error', viewer: 'info', customer: 'success'
        };
        return `badge badge-${colors[role] || 'info'}`;
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className={styles.accessDenied}>
                <FiShield size={48} />
                <h2>Access Denied</h2>
                <p>You don&apos;t have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>User Management</h1>
                    <p>Manage user accounts and permissions</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus size={18} /> Add User
                    </button>
                </div>
            </header>

            {/* Stats */}
            {stats && (
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                            <FiUsers size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.totalUsers}</div>
                        <div className="stat-card-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <FiCheck size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.activeUsers}</div>
                        <div className="stat-card-label">Active Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                            <FiUsers size={24} color="white" />
                        </div>
                        <div className="stat-card-value">{stats.recentUsers}</div>
                        <div className="stat-card-label">New (30 days)</div>
                    </div>
                </div>
            )}

            {/* Role Distribution */}
            {stats?.byRole && (
                <div className={styles.roleDistribution}>
                    <div className={styles.roleCard}>
                        <span className={styles.roleCount}>{stats.byRole.admin || 0}</span>
                        <span className={styles.roleLabel}>Admins</span>
                    </div>
                    <div className={styles.roleCard}>
                        <span className={styles.roleCount}>{stats.byRole.viewer || 0}</span>
                        <span className={styles.roleLabel}>Viewers</span>
                    </div>
                    <div className={styles.roleCard}>
                        <span className={styles.roleCount}>{stats.byRole.customer || 0}</span>
                        <span className={styles.roleLabel}>Customers</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchInput}>
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    />
                </div>
                <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: '150px' }}>
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                    <option value="customer">Customer</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="table-container">
                {isLoading ? (
                    <div className={styles.loadingState}><div className="spinner"></div></div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.userAvatar}>
                                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                            </div>
                                            <span>{user.fullName}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.company || '-'}</td>
                                    <td><span className={getRoleBadge(user.role)}>{user.role}</span></td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} title="Edit"><FiEdit size={16} /></button>
                                            {user.isActive ? (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deactivateBtn}`}
                                                    title="Deactivate"
                                                    onClick={() => handleDeactivate(user._id)}
                                                    disabled={user._id === currentUser?._id}
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.activateBtn}`}
                                                    title="Activate"
                                                    onClick={() => handleActivate(user._id)}
                                                >
                                                    <FiCheck size={16} />
                                                </button>
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
