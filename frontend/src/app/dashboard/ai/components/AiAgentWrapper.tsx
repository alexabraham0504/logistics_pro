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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard/ai' },
        { id: 'fleet', label: 'Fleet Optimizer', href: '/dashboard/ai/agent/fleet' },
        { id: 'inventory', label: 'Inventory Analyst', href: '/dashboard/ai/agent/inventory' },
        { id: 'tracking', label: 'Shipment Tracking', href: '/dashboard/ai/agent/tracking' },
        { id: 'market', label: 'Market Intelligence', href: '/dashboard/ai/agent/market' },
        { id: 'contract', label: 'Contract Intelligence', href: '/dashboard/ai/agent/contract' },
        { id: 'zone', label: 'Zone Heatmap', href: '/dashboard/ai/agent/zone' },
        { id: 'carrier', label: 'Carrier Wizard', href: '/dashboard/ai/agent/carrier' },
        { id: 'support', label: 'Logistics Assistant', href: '/dashboard/ai/agent/support' },
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 12000,
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            width: '100%',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Fixed Top Header */}
            <header className={styles.agentHeader}>
                <Link href="/dashboard/ai" className={styles.agentBackBtn}>
                    <FiArrowLeft size={20} />
                </Link>
                <div className={styles.agentHeaderCenter} style={{ pointerEvents: 'none' }}>
                    <div className={styles.agentHeaderIcon}>
                        <FiCpu size={16} />
                    </div>
                    <h1 className={styles.agentHeaderTitle}>{agentName || 'Agent Studio'}</h1>
                </div>
                <button
                    className={styles.agentMenuBtn}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    style={{ pointerEvents: 'auto' }}
                >
                    {isSidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
            </header>

            {/* Right-side Sliding Panel */}
            {isSidebarOpen && (
                <>
                    <div
                        className={styles.agentOverlay}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ zIndex: 1000000 }}
                    />
                    <aside className={styles.agentSidebar} style={{ zIndex: 1000001 }}>
                        <div className={styles.agentSidebarHeader}>
                            <div className={styles.logoIcon}>
                                <FiCpu size={18} />
                            </div>
                            <span className={styles.logoText}>Navigation</span>
                        </div>
                        <nav className={styles.agentSidebarNav}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={styles.agentNavLink}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className={styles.agentContent}>
                {children}
            </main>
        </div>
    );
}
