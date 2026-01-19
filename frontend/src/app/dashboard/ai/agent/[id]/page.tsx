'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './chat.module.css';
import MarketDashboard from '../../components/MarketDashboard';
import TrackingView from '../../components/TrackingView';
import ZoneHeatmap from '../../components/ZoneHeatmap';
import CarrierWizard from '../../components/CarrierWizard';
import ContractView from '../../components/ContractView';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    data?: unknown;
    visualization?: string;
}

interface Agent {
    id: string;
    name: string;
    description: string;
    model: string;
    status: string;
    icon: string;
    capabilities: string[];
}

export default function AgentChat() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAgent();
    }, [agentId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchAgent = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/agents/${agentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setAgent(response.data.data.agent);
                // Add welcome message
                setMessages([{
                    id: '0',
                    role: 'assistant',
                    content: `Hello! I'm the **${response.data.data.agent.name}**. ${response.data.data.agent.description}\n\nHow can I assist you today?`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to fetch agent:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/chat`,
                { agentId, message: input },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response.data.data.response,
                    timestamp: new Date(),
                    data: response.data.data.data,
                    visualization: response.data.data.visualization
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I apologize, but I encountered an error processing your request. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedQueries = getSuggestedQueries(agentId);

    const handleSuggestion = (query: string) => {
        setInput(query);
    };

    if (initialLoading) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading Agent...</p>
                </div>
            </div>
        );
    }

    // Route to specialized views based on agent type
    if (agentId === 'market') {
        return <MarketDashboard />;
    }
    if (agentId === 'tracking') {
        return <TrackingView />;
    }
    if (agentId === 'zone') {
        return <ZoneHeatmap />;
    }
    if (agentId === 'carrier') {
        return <CarrierWizard />;
    }
    if (agentId === 'contract') {
        return <ContractView />;
    }

    return (
        <div className={styles.chatContainer}>
            {/* Header */}
            <header className={styles.chatHeader}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back
                </Link>
                <div className={styles.agentInfo}>
                    <span className={styles.agentIcon}>{agent?.icon}</span>
                    <div>
                        <h1 className={styles.agentName}>{agent?.name}</h1>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <span className={`${styles.statusBadge} ${agent?.status === 'active' ? styles.active : ''}`}>
                        {agent?.status}
                    </span>
                </div>
            </header>

            {/* Messages Area */}
            <div className={styles.messagesArea}>
                <div className={styles.messagesContainer}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className={styles.avatarIcon}>{agent?.icon}</div>
                            )}
                            <div className={styles.messageContent}>
                                <div className={styles.messageText} dangerouslySetInnerHTML={{
                                    __html: formatMessage(msg.content)
                                }} />
                                {msg.visualization && (
                                    <div className={styles.visualizationHint}>
                                        📊 Visualization: {msg.visualization}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className={`${styles.message} ${styles.assistantMessage}`}>
                            <div className={styles.avatarIcon}>{agent?.icon}</div>
                            <div className={styles.messageContent}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
                <div className={styles.suggestions}>
                    <p className={styles.suggestionsTitle}>Try asking:</p>
                    <div className={styles.suggestionChips}>
                        {suggestedQueries.map((query, idx) => (
                            <button
                                key={idx}
                                className={styles.suggestionChip}
                                onClick={() => handleSuggestion(query)}
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={sendMessage} className={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${agent?.name || 'the agent'}...`}
                    className={styles.chatInput}
                    disabled={loading}
                />
                <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={!input.trim() || loading}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

function getSuggestedQueries(agentId: string): string[] {
    const suggestions: Record<string, string[]> = {
        fleet: ['Where are my trucks?', 'Show driver status', 'Which vehicles are in transit?'],
        inventory: ['Show low stock items', 'Warehouse distribution', 'Reorder recommendations'],
        tracking: ['Track my latest shipment', 'Show delivery timeline', 'Pending deliveries'],
        contract: ['Analyze my contracts', 'Show expiring agreements', 'Rate card summary'],
        zone: ['Show zone coverage', 'DAS/EDAS analysis', 'Fee optimization'],
        carrier: ['Carrier comparison', 'Optimization proposal', 'Savings analysis'],
        market: ['Latest industry news', 'Company watch: FedEx', 'Market trends'],
        support: ['How do I track a shipment?', 'Platform overview', 'Best practices']
    };
    return suggestions[agentId] || suggestions.support;
}

function formatMessage(content: string): string {
    // Convert markdown-style bold to HTML
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    // Convert bullet points
    formatted = formatted.replace(/• /g, '<span class="bullet">•</span> ');
    return formatted;
}
