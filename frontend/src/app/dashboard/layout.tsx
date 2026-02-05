'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from '@/context/NotificationContext';
import {
    FiTruck, FiHome, FiPackage, FiMapPin, FiBox,
    FiUsers, FiBarChart2, FiLogOut, FiMenu, FiArchive, FiCpu, FiShield
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import styles from './dashboard.module.css';
import { IconType } from 'react-icons';

interface NavItem {
    href: string;
    icon: IconType;
    label: string;
    section?: string;
}

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarHovered, setSidebarHovered] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    // Navigation items based on role
    const getNavItems = (): NavItem[] => {
        const baseItems: NavItem[] = [
            { href: '/dashboard', icon: FiHome, label: 'Dashboard' },
        ];

        if (user?.role === 'customer') {
            return [
                ...baseItems,
                { href: '/dashboard/my-orders', icon: FiPackage, label: 'My Orders' },
                { href: '/dashboard/tracking', icon: FiMapPin, label: 'Track Shipment' },
                { href: '/dashboard/invoices', icon: FaRupeeSign, label: 'My Invoices' },
            ];
        }

        const fullNavItems: NavItem[] = [
            ...baseItems,
            { href: '/dashboard/orders', icon: FiPackage, label: 'Orders', section: 'Operations' },
            { href: '/dashboard/shipments', icon: FiMapPin, label: 'Shipments' },
            { href: '/dashboard/warehouses', icon: FiArchive, label: 'Warehouses', section: 'Inventory' },
            { href: '/dashboard/inventory', icon: FiBox, label: 'Inventory' },
            { href: '/dashboard/fleet', icon: FiTruck, label: 'Fleet', section: 'Assets' },
            { href: '/dashboard/invoices', icon: FaRupeeSign, label: 'Invoices', section: 'Finance' },
            { href: '/dashboard/reports', icon: FiBarChart2, label: 'Reports', section: 'Analytics' },
            { href: '/dashboard/ai', icon: FiCpu, label: 'AI Intelligence', section: 'Intelligence' },
            { href: '/dashboard/blockchain', icon: FiShield, label: 'Blockchain', section: 'Verification' },
        ];

        if (user?.role === 'admin') {
            fullNavItems.push({ href: '/dashboard/users', icon: FiUsers, label: 'Users', section: 'Admin' });
        }

        return fullNavItems;
    };

    const navItems = getNavItems();
    let currentSection = '';

    return (
        <div className={styles.dashboardLayout}>
            {/* Mobile Menu Toggle */}
            {!sidebarOpen && !pathname.includes('/ai/agent') && (
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setSidebarOpen(true)}
                    style={pathname.startsWith('/dashboard/ai') ? {
                        backgroundColor: '#0a0a0a',
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    } : {}}
                >
                    <FiMenu size={24} />
                </button>
            )}

            {/* Hover trigger zone */}
            <div
                className={styles.sidebarTrigger}
                onMouseEnter={() => setSidebarHovered(true)}
            />

            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarHovered ? 'hovered' : ''}`}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <FiTruck size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cochin Logistics</span>
                </div>

                <div className={styles.userInfoTop}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.fullName}</span>
                            <span className={styles.userRole}>{user?.role}</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <FiLogOut size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, index) => {
                        const showSection = item.section && item.section !== currentSection;
                        if (item.section) currentSection = item.section;

                        return (
                            <div key={item.href}>
                                {showSection && (
                                    <div className="sidebar-section-title">{item.section}</div>
                                )}
                                <Link
                                    href={item.href}
                                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Backdrop */}
            {sidebarOpen && (
                <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content Area */}
            <main
                className={`main-content ${sidebarHovered ? 'sidebar-visible' : ''} ${(pathname.startsWith('/dashboard/ai') || pathname.startsWith('/dashboard/blockchain')) ? styles.fullBleed : ''}`}
                style={{ position: 'relative' }} // So we can position the bell
            >
                {/* GLOBAL PAGE-LEVEL NOTIFICATION BELL */}
                {!pathname.startsWith('/dashboard/ai') && (
                    <div style={{
                        position: 'fixed',
                        top: pathname.startsWith('/dashboard/blockchain') ? '24px' : '80px',
                        right: '24px',
                        zIndex: 100,
                        backgroundColor: pathname.startsWith('/dashboard/blockchain') ? 'rgba(15, 23, 42, 0.9)' : 'white',
                        borderRadius: '14px',
                        boxShadow: pathname.startsWith('/dashboard/blockchain')
                            ? '0 8px 30px rgba(0,0,0,0.4)'
                            : '0 8px 30px rgba(0,0,0,0.12)',
                        border: pathname.startsWith('/dashboard/blockchain')
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid #eef2f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px'
                    }}>
                        <NotificationBell />
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
