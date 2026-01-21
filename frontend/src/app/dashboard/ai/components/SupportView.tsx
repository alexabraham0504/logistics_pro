'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiCpu, FiPlus, FiArrowLeft, FiMoreHorizontal } from 'react-icons/fi';
import styles from './SupportView.module.css';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function SupportView() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your Logistics Assistant. I can help you with shipment inquiries, fleet status, warehouse inventory data, or general platform support. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Mock AI response for now
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I've received your inquiry. I'm currently analyzing the real-time logistics data to provide you with the most accurate answer. (Gemini response simulation)",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={`${styles.backBtn} ${styles.hideOnMobile}`}>
                    <FiArrowLeft /> Back to Agent Studio
                </Link>
                <div className={styles.agentInfo}>
                    <div className={styles.avatar}>
                        <FiCpu />
                    </div>
                    <div>
                        <h1 className={styles.title}>Logistics Assistant</h1>
                        <p className={styles.status}>Online • Ready to assist</p>
                    </div>
                </div>
                <button className={styles.moreBtn}><FiMoreHorizontal /></button>
            </header>

            <div className={styles.chatWindow}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}>
                        <div className={styles.messageAvatar}>
                            {msg.role === 'user' ? <FiUser /> : <FiCpu />}
                        </div>
                        <div className={styles.messageContent}>
                            <p className={styles.text}>{msg.content}</p>
                            <span className={styles.time}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className={styles.typingIndicator}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer className={styles.footer}>
                <div className={styles.inputWrapper}>
                    <button className={styles.plusBtn}><FiPlus /></button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your logistics question..."
                        className={styles.input}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()}>
                        <FiSend />
                    </button>
                </div>
                <p className={styles.disclaimer}>AI assistant can make mistakes. Check important info.</p>
            </footer>
        </div>
    );
}
