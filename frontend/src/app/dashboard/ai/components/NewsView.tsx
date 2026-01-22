'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './NewsView.module.css';
import { FiClock, FiRefreshCw, FiExternalLink, FiGlobe } from 'react-icons/fi';

interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    image?: string;
    datetime: string;
}

interface NewsViewProps {
    onBack?: () => void;
}

export default function NewsView({ onBack }: NewsViewProps) {
    const { token } = useAuth();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/ai/market/news');

            if (response.data.success && response.data.data.articles) {
                setNews(response.data.data.articles);
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading && news.length === 0) {
        return (
            <div className={styles.loading}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner"></div>
                    <span>Loading real-time logistics news...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Global Logistics News</h1>
                    <p className={styles.subtitle}>Curated headlines from Yahoo Finance</p>
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={fetchNews}
                    disabled={refreshing}
                >
                    <FiRefreshCw className={refreshing ? 'spin' : ''} />
                    Refresh
                </button>
            </header>

            {news.length === 0 ? (
                <div className={styles.loading}>No news available at the moment.</div>
            ) : (
                <div className={styles.newsGrid}>
                    {news.map((article) => (
                        <a
                            key={article.id}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.newsCard}
                        >
                            <div className={styles.newsImageContainer}>
                                {article.image ? (
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className={styles.newsImage}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FiGlobe size={40} color="rgba(255,255,255,0.1)" />
                                    </div>
                                )}
                            </div>
                            <div className={styles.newsContent}>
                                <span className={styles.newsSource}>{article.source}</span>
                                <h3 className={styles.newsTitle}>{article.title}</h3>
                                {article.summary && (
                                    <p className={styles.newsSummary}>{article.summary}</p>
                                )}
                                <div className={styles.newsFooter}>
                                    <span className={styles.time}>
                                        <FiClock size={12} /> {formatDate(article.datetime)}
                                    </span>
                                    <span className={styles.readMore}>
                                        Read <FiExternalLink size={12} style={{ marginLeft: 4 }} />
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
