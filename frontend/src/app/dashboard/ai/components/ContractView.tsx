'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import styles from './ContractView.module.css';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial greeting
        setMessages([{
            id: '1',
            role: 'assistant',
            content: `Hello! I'm the **Contract Intelligence** agent. I can help you analyze logistics contracts and documents.\n\n📄 **Upload a document** to get started, or ask me questions about contract analysis.`,
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
        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
            addMessage('assistant', '⚠️ Please upload a PDF, TXT, DOC, or DOCX file.');
            return;
        }

        setUploading(true);

        try {
            let content = '';

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

            addMessage('assistant', `✅ **Document processed successfully!**\n\n📄 **File:** ${file.name}\n📊 **Size:** ${(file.size / 1024).toFixed(1)} KB\n📝 **Extracted Text:** ${content.length} characters\n\nI've analyzed the document content. You can now ask me questions about it.`);

        } catch (error) {
            console.error('File processing error:', error);
            addMessage('assistant', '❌ Failed to read the document. Please ensure it is a valid text or PDF file.');
        }

        setUploading(false);
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            // Dynamically import pdfjs-dist
            const pdfJS = await import('pdfjs-dist');
            // Use unpkg for better version matching with npm, and use .mjs for newer versions
            pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
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
            reader.onload = (e) => {
                const text = e.target?.result as string;
                resolve(text);
            };
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
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
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

    const clearDocument = () => {
        setDocument(null);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: '📄 Document cleared. You can upload a new document to analyze.',
            timestamp: new Date()
        }]);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>📄</span>
                    <h1>Contract Intelligence</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.badge}>Document Analysis</span>
                </div>
            </header>

            <div className={styles.mainContent}>
                {/* Document Panel */}
                <aside className={styles.documentPanel}>
                    <h3 className={styles.panelTitle}>Document</h3>

                    {document ? (
                        <div className={styles.documentInfo}>
                            <div className={styles.docIcon}>📄</div>
                            <div className={styles.docDetails}>
                                <span className={styles.docName}>{document.name}</span>
                                <span className={styles.docSize}>{(document.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button onClick={clearDocument} className={styles.clearBtn}>✕</button>
                        </div>
                    ) : (
                        <div
                            className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className={styles.uploading}>
                                    <div className={styles.spinner}></div>
                                    <p>Processing document...</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.uploadIcon}>📤</div>
                                    <p className={styles.uploadText}>Drag & drop a document</p>
                                    <p className={styles.uploadHint}>or click to browse</p>
                                    <span className={styles.uploadFormats}>PDF, TXT, DOC, DOCX</span>
                                </>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />

                    <div className={styles.capabilities}>
                        <h4>I can help you with:</h4>
                        <ul>
                            <li>📋 Document summarization</li>
                            <li>🔍 Key terms extraction</li>
                            <li>📅 Expiry date detection</li>
                            <li>💰 Rate card analysis</li>
                            <li>⚠️ Risk identification</li>
                        </ul>
                    </div>
                </aside>

                {/* Chat Panel */}
                <main className={styles.chatPanel}>
                    <div className={styles.messagesArea}>
                        <div className={styles.messagesContainer}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`${styles.message} ${styles[msg.role + 'Message']}`}>
                                    <div className={styles.avatarIcon}>
                                        {msg.role === 'user' ? '👤' : '📄'}
                                    </div>
                                    <div className={styles.messageContent}>
                                        <div className={styles.messageText}
                                            dangerouslySetInnerHTML={{
                                                __html: msg.content
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\n/g, '<br/>')
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className={`${styles.message} ${styles.assistantMessage}`}>
                                    <div className={styles.avatarIcon}>📄</div>
                                    <div className={styles.messageContent}>
                                        <div className={styles.typingIndicator}>
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={document ? "Ask about the document..." : "Upload a document to get started..."}
                            className={styles.chatInput}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className={styles.sendBtn}
                        >
                            Send
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
