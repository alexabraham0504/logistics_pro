'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { FiCpu, FiMenu, FiX, FiArrowLeft } from 'react-icons/fi';
import styles from '../ai.module.css';

interface AiAgentWrapperProps {
    children: ReactNode;
    agentName?: string;
}

export default function AiAgentWrapper({ children, agentName }: AiAgentWrapperProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard/ai' },
        { id: 'news', label: 'News', href: '/dashboard/ai?tab=news' },
        { id: 'clipped', label: 'Clipped', href: '/dashboard/ai?tab=clipped' },
        { id: 'agents', label: 'Agents', href: '/dashboard/ai?tab=agents' },
    ];

    return (
        <div className={styles.pageWrapper}>
            {/* Standard AI Mobile Header - Always on top for all agents */}
            <div className={styles.mobileHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '4.25rem' }}>
                    <Link href="/dashboard/ai" className={styles.backBtnMobile}>
                        <FiArrowLeft size={18} />
                    </Link>
                    <div className={styles.logoIcon}>
                        <FiCpu size={16} />
                    </div>
                    <span className={styles.logoText}>{agentName || 'Agent Studio'}</span>
                </div>
                <button
                    className={styles.menuToggle}
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                >
                    {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            {/* Shared AI Sidebar for all pages */}
            <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoIcon}>
                        <FiCpu size={18} />
                    </div>
                    <span className={styles.logoText}>Agent Studio</span>
                </div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={styles.navItem}
                            onClick={() => setIsMobileSidebarOpen(false)}
                        >
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isMobileSidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                {children}
            </div>
        </div>
    );
}
