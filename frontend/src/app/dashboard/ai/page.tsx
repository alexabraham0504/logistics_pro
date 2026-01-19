'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './ai.module.css';

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

export default function AiDashboard() {
    const { token } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [loading, setLoading] = useState(true);

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
            <div className={styles.aiContainer}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading AI Agents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.aiContainer}>
            {/* Header */}
            <header className={styles.aiHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.logoIcon}>🤖</div>
                    <div>
                        <h1 className={styles.title}>Agent Studio</h1>
                        <p className={styles.subtitle}>Logistics Intelligence Hub</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.systemStatus}>
                        <span className={styles.statusDot}></span>
                        <span>System Operational</span>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🤖</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.totalAgents || 0}</span>
                        <span className={styles.statLabel}>Total Agents</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.activeAgents || 0}</span>
                        <span className={styles.statLabel}>Active Models</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.executionsToday || 0}</span>
                        <span className={styles.statLabel}>Executions Today</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⚡</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>99.8%</span>
                        <span className={styles.statLabel}>Accuracy</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionGrid}>
                    <Link href="/dashboard/ai/agent/support" className={styles.actionCard}>
                        <div className={styles.actionIcon}>💬</div>
                        <div>
                            <h3>New Chat</h3>
                            <p>Start a conversation</p>
                        </div>
                    </Link>
                    <Link href="/dashboard/ai/agent/fleet" className={styles.actionCard}>
                        <div className={styles.actionIcon}>🚛</div>
                        <div>
                            <h3>Fleet Status</h3>
                            <p>Check vehicle locations</p>
                        </div>
                    </Link>
                    <Link href="/dashboard/ai/agent/inventory" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📦</div>
                        <div>
                            <h3>Low Stock Alert</h3>
                            <p>View inventory warnings</p>
                        </div>
                    </Link>
                    <Link href="/dashboard/ai/agent/market" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📊</div>
                        <div>
                            <h3>Market Lens</h3>
                            <p>Industry intelligence</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Agents Grid */}
            <section className={styles.agentsSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Available Agents</h2>
                    <span className={styles.agentCount}>{agents.length} agents</span>
                </div>
                <div className={styles.agentsGrid}>
                    {agents.map((agent) => (
                        <Link
                            key={agent.id}
                            href={`/dashboard/ai/agent/${agent.id}`}
                            className={styles.agentCard}
                        >
                            <div className={styles.agentHeader}>
                                <span className={styles.agentIcon}>{agent.icon}</span>
                                <span className={`${styles.agentStatus} ${agent.status === 'active' ? styles.active : ''}`}>
                                    {agent.status}
                                </span>
                            </div>
                            <h3 className={styles.agentName}>{agent.name}</h3>
                            <p className={styles.agentDescription}>{agent.description}</p>
                            <div className={styles.agentCapabilities}>
                                {agent.capabilities.slice(0, 2).map((cap, idx) => (
                                    <span key={idx} className={styles.capabilityTag}>{cap}</span>
                                ))}
                                {agent.capabilities.length > 2 && (
                                    <span className={styles.capabilityMore}>+{agent.capabilities.length - 2}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
