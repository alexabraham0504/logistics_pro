'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './ContractView.module.css';
import { FiChevronLeft, FiMaximize2, FiPaperclip } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface UploadedDocument {
    name: string;
    size: number;
    type: string;
    content: string;
}

export default function ContractView() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [document, setDocument] = useState<UploadedDocument | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // New state for UI buttons
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial greeting - GENERIC as requested
        setMessages([{
            id: '1',
            role: 'assistant',
            content: `Hello! I'm the **Contract Intelligence** agent. Upload a document to get started.`,
            timestamp: new Date()
        }]);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
            addMessage('assistant', '⚠️ Please upload a PDF, TXT, DOC, or DOCX file.');
            return;
        }

        setUploading(true);

        try {
            let content = '';
            // Only import pdfjs if needed to save bundle size
            if (file.type === 'application/pdf') {
                content = await extractTextFromPDF(file);
            } else {
                content = await readFileContent(file);
            }

            setDocument({
                name: file.name,
                size: file.size,
                type: file.type,
                content: content
            });

            addMessage('assistant', `✅ **Document processed successfully!**\n\n📄 **File:** ${file.name}\nI've analyzed the content. You can now ask questions.`);

        } catch (error) {
            console.error('File processing error:', error);
            addMessage('assistant', '❌ Failed to read the document.');
        }

        setUploading(false);
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            const pdfJS = await import('pdfjs-dist');
            pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
            }
            return fullText;
        } catch (e) {
            console.error('PDF extraction failed', e);
            throw new Error('PDF extraction failed');
        }
    };

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date()
        }]);
    };

    // New Handlers
    const handleDetailsClick = () => {
        setDetailsOpen(!detailsOpen);
    };

    const handleToggleClick = () => {
        setIsEnabled(!isEnabled);
    };

    const handleSend = async () => {
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
                {
                    agentId: 'contract',
                    message: input,
                    documentContent: document?.content || null,
                    documentName: document?.name || null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Chat API Error:", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please check your connection.',
                timestamp: new Date()
            }]);
        }

        setLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={`${styles.backBtn} ${styles.hideOnMobile}`}>
                    <FiChevronLeft /> Back to Dashboard
                </Link>
            </header>

            <div className={styles.splitLayout}>
                {/* Left Panel: Document Interaction */}
                <div className={styles.leftPanel}>
                    <div className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>Contract Digitization</h2>
                        <div className={styles.panelControls}>
                            <button
                                className={styles.controlBtn}
                                onClick={handleDetailsClick}
                            >
                                Details
                            </button>
                            <button
                                className={styles.toggleBtn}
                                onClick={handleToggleClick}
                                style={{ backgroundColor: isEnabled ? '#0066cc' : '#333' }}
                            >
                                <div
                                    className={styles.toggleThumb}
                                    style={{ left: isEnabled ? 'auto' : '2px', right: isEnabled ? '2px' : 'auto' }}
                                />
                            </button>
                        </div>
                    </div>

                    {detailsOpen && (
                        <div style={{ padding: '0 0 1rem 0', color: '#888', fontSize: '0.8rem', borderBottom: '1px solid #333', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Recent Files: 5</span>
                                <span>Status: Active</span>
                            </div>
                        </div>
                    )}

                    <div
                        className={`${styles.documentViewer} ${dragActive ? styles.dragActive : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {document ? (
                            <div className={styles.documentPreview}>
                                <div className={styles.docIcon}>📄</div>
                                <h3>{document.name}</h3>
                                <p>{(document.size / 1024).toFixed(1)} KB</p>
                                <div className={styles.docContentPreview}>
                                    {document.content.substring(0, 500)}...
                                </div>
                                <button onClick={() => setDocument(null)} className={styles.clearBtn}>Remove Document</button>
                            </div>
                        ) : (
                            <div className={styles.uploadPlaceholder} onClick={() => fileInputRef.current?.click()}>
                                <div className={styles.uploadContent}>
                                    {uploading ? (
                                        <div className={styles.spinner}></div>
                                    ) : (
                                        <>
                                            <FiPaperclip size={32} />
                                            <h3>Drop your Contract Here</h3>
                                            <p>PDF, DOCX, TXT supported</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Right Panel: Chat Interface */}
                <div className={styles.rightPanel}>
                    <div className={styles.chatHeader}>
                        <div className={styles.chatTitleIcon}>
                            <HiOutlineSparkles size={18} className={styles.sparkleIcon} />
                            <span>AI Chatbot</span>
                        </div>
                        <h1>Welcome to the AI Chat</h1>
                        <p>Get the Answers You Need—Our Chatbot Has You Covered!</p>
                    </div>

                    <div className={styles.chatHistory}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.role === 'user' && <div className={styles.userLabel}>{msg.content}</div>}
                                {msg.role === 'assistant' && (
                                    <div className={styles.assistantBubble}
                                        dangerouslySetInnerHTML={{
                                            __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.message} ${styles.assistant}`}>
                                <div className={styles.assistantBubble}>
                                    <div className={styles.typingIndicator}><span></span><span></span><span></span></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.inputWrapper}>
                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Message AI Chat"
                                className={styles.chatInput}
                                disabled={loading}
                            />
                            <button onClick={handleSend} className={styles.sendButton} disabled={loading}>
                                <div className={styles.sendIcon}>Send</div>
                            </button>
                        </div>
                        <div className={styles.footerControls}>
                            <button className={styles.iconButton}><FiMaximize2 /></button>
                            <div className={styles.footerToggles}>
                                <span className={styles.ccIcon}>CC</span>
                                <button className={styles.settingBtn}>⚙️</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
