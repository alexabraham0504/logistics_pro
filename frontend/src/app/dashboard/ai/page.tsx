'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './ai.module.css';
import ClippedView from './components/ClippedView';
import NewsView from './components/NewsView';
import {
    FiCpu, FiUsers, FiLayers, FiMessageSquare, FiFileText,
    FiTool, FiZap, FiPlus, FiBox, FiEdit3, FiGrid,
    FiTruck, FiPackage, FiMap, FiClipboard, FiBarChart2,
    FiDatabase, FiWifi, FiServer, FiGlobe, FiMenu, FiX
} from 'react-icons/fi';

import {
    HiOutlineCube, HiOutlineSparkles, HiOutlineDocumentText,
    HiOutlineTemplate, HiOutlinePencil, HiOutlineLightningBolt
} from 'react-icons/hi';

interface Agent {
    id: string;
    name: string;
    description: string;
    model: string;
    status: string;
    icon: string;
    capabilities: string[];
}

interface AgentStats {
    totalAgents: number;
    activeAgents: number;
    executionsToday: number;
}

// Agent icon mapping
const agentIcons: { [key: string]: React.ReactNode } = {
    'fleet': <FiTruck size={16} />,
    'inventory': <FiPackage size={16} />,
    'shipment': <FiMap size={16} />,
    'contract': <FiClipboard size={16} />,
    'zone': <FiGrid size={16} />,
    'carrier': <FiTruck size={16} />,
    'market': <FiBarChart2 size={16} />,
    'logistics': <FiBox size={16} />,
};

export default function AiDashboard() {
    const { token } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState('dashboard');
    const [showAllAgents, setShowAllAgents] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/agents`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAgents(response.data.data.agents);
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading Agent Studio...</p>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FiLayers size={16} /> },
        { id: 'news', label: 'News', icon: <FiGlobe size={16} /> },
        { id: 'clipped', label: 'Clipped', icon: <FiClipboard size={16} /> },
        { id: 'agents', label: 'Agents', icon: <FiCpu size={16} /> },
        { id: 'models', label: 'Models', icon: <HiOutlineSparkles size={16} /> },
        { id: 'prompts', label: 'Prompts', icon: <FiMessageSquare size={16} /> },
        { id: 'templates', label: 'Templates', icon: <FiFileText size={16} /> },
        { id: 'tools', label: 'Tools', icon: <FiTool size={16} /> },
        { id: 'workflows', label: 'Workflows', icon: <FiZap size={16} /> },
    ];

    const quickActions = [
        {
            id: 'create-agent',
            title: 'Create New Agent',
            description: 'Create a new agent with custom configurations',
            icon: <FiCpu size={18} />,
            color: '#f97316',
            href: '/dashboard/ai/create-agent',
        },
        {
            id: 'add-model',
            title: 'Add Model',
            description: 'Connect a new AI model to the platform',
            icon: <HiOutlineCube size={18} />,
            color: '#f59e0b',
            href: '/dashboard/ai/add-model',
        },
        {
            id: 'write-prompt',
            title: 'Write Prompt',
            description: 'Create a new prompt template',
            icon: <HiOutlinePencil size={18} />,
            color: '#a855f7',
            href: '/dashboard/ai/write-prompt',
        },
        {
            id: 'browse-templates',
            title: 'Browse Templates',
            description: 'Find ready-to-use templates',
            icon: <HiOutlineDocumentText size={18} />,
            color: '#ec4899',
            href: '/dashboard/ai/templates',
        },
    ];

    const displayedAgents = showAllAgents ? agents : agents.slice(0, 4);

    const getAgentIcon = (agentId: string) => {
        const key = agentId.toLowerCase();
        for (const [iconKey, icon] of Object.entries(agentIcons)) {
            if (key.includes(iconKey)) {
                return icon;
            }
        }
        return <FiCpu size={16} />;
    };

    return (
        <div className={styles.pageWrapper}>
            {/* Mobile Header */}
            <div className={styles.mobileHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '4.25rem' }}>
                    <div className={styles.logoIcon}>
                        <FiCpu size={18} />
                    </div>
                    <span className={styles.logoText}>Agent Studio</span>
                </div>
                <button
                    className={styles.menuToggle}
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                >
                    {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            {/* Left Sidebar */}
            <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoIcon}>
                        <FiCpu size={18} />
                    </div>
                    <span className={styles.logoText}>Agent Studio</span>
                </div>
                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeNav === item.id ? styles.navItemActive : ''}`}
                            onClick={() => {
                                setActiveNav(item.id);
                                setIsMobileSidebarOpen(false);
                            }}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </button>
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

            {/* Main Content or Clipped View */}
            {activeNav === 'clipped' ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <ClippedView onBack={() => setActiveNav('dashboard')} />
                </div>
            ) : activeNav === 'news' ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <NewsView onBack={() => setActiveNav('dashboard')} />
                </div>
            ) : (
                <main className={styles.mainContent}>
                    {/* Dashboard Header */}
                    <header className={styles.dashboardHeader}>
                        <div>
                            <h1 className={styles.dashboardTitle}>Dashboard</h1>
                            <p className={styles.dashboardSubtitle}>Welcome to the Agent Studio</p>
                        </div>
                    </header>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Total Agents</span>
                                <span className={styles.statValue}>{stats?.totalAgents || agents.length}</span>
                                <span className={styles.statTrend}>+2 from last week</span>
                            </div>
                            <div className={`${styles.statIconBox} ${styles.blue}`}>
                                <FiCpu size={20} />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Active Models</span>
                                <span className={styles.statValue}>{stats?.activeAgents || agents.filter(a => a.status === 'active').length}</span>
                                <span className={`${styles.statTrend} ${styles.green}`}>Connected &amp; ready</span>
                            </div>
                            <div className={`${styles.statIconBox} ${styles.orange}`}>
                                <HiOutlineSparkles size={20} />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Prompts</span>
                                <span className={styles.statValue}>4</span>
                                <span className={styles.statTrend}>Reusable prompts</span>
                            </div>
                            <div className={`${styles.statIconBox} ${styles.purple}`}>
                                <FiFileText size={20} />
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Executions Today</span>
                                <span className={styles.statValue}>{stats?.executionsToday || 0}</span>
                                <span className={styles.statTrend}>0% success rate</span>
                            </div>
                            <div className={`${styles.statIconBox} ${styles.teal}`}>
                                <HiOutlineLightningBolt size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <section className={styles.quickActionsSection}>
                        <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        <div className={styles.quickActionsGrid}>
                            {quickActions.map((action) => (
                                <Link key={action.id} href={action.href} className={styles.quickActionCard}>
                                    <div
                                        className={styles.quickActionIcon}
                                        style={{ backgroundColor: `${action.color}20`, color: action.color }}
                                    >
                                        {action.icon}
                                    </div>
                                    <h3 className={styles.quickActionTitle}>{action.title}</h3>
                                    <p className={styles.quickActionDesc}>{action.description}</p>
                                    <span className={styles.quickActionLink}>
                                        Get started <span className={styles.arrow}>→</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Bottom Section: Recent Agents + System Status */}
                    <div className={styles.bottomSection}>
                        {/* Recent Agents */}
                        <section className={styles.recentAgentsSection}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle}>Recent Agents</h2>
                                    <p className={styles.sectionSubtitle}>Your most recently created agents</p>
                                </div>
                                <button
                                    className={styles.viewAllBtn}
                                    onClick={() => setShowAllAgents(!showAllAgents)}
                                >
                                    {showAllAgents ? 'Show Less' : 'View all agents'}
                                </button>
                            </div>
                            <div className={styles.agentsList}>
                                {displayedAgents.map((agent, index) => (
                                    <Link
                                        key={agent.id}
                                        href={`/dashboard/ai/agent/${agent.id}`}
                                        className={styles.recentAgentItem}
                                    >
                                        <span className={styles.recentAgentIcon}>
                                            {getAgentIcon(agent.id)}
                                        </span>
                                        <span className={styles.recentAgentName}>{agent.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* System Status */}
                        <section className={styles.systemStatusSection}>
                            <h2 className={styles.sectionTitle}>System Status</h2>
                            <p className={styles.sectionSubtitle}>Current platform performance</p>
                            <div className={styles.statusList}>
                                <div className={styles.statusItem}>
                                    <span className={styles.statusIcon}>
                                        <FiServer size={14} />
                                    </span>
                                    <span className={styles.statusLabel}>API Health</span>
                                    <span className={styles.statusBadge}>Operational</span>
                                </div>
                                <div className={styles.statusItem}>
                                    <span className={styles.statusIcon}>
                                        <FiWifi size={14} />
                                    </span>
                                    <span className={styles.statusLabel}>Model Connectivity</span>
                                    <span className={styles.statusBadge}>Operational</span>
                                </div>
                                <div className={styles.statusItem}>
                                    <span className={styles.statusIcon}>
                                        <FiDatabase size={14} />
                                    </span>
                                    <span className={styles.statusLabel}>Database</span>
                                    <span className={styles.statusBadge}>Operational</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            )}
        </div>
    );
}
