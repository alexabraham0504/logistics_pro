'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './MarketDashboard.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface CompanyData {
    ticker: string;
    name: string;
    sector: string;
    logo: string;
    marketCap: number;
    quote: {
        current: number;
        high: number;
        low: number;
        open: number;
        previousClose: number;
        change: number;
        percentChange: number;
    };
}

interface NewsArticle {
    id: number;
    title: string;
    summary: string;
    source: string;
    url: string;
    image: string;
    datetime: number;
}

const TICKERS = ['FDX', 'UPS', 'XPO', 'CHRW', 'EXPD'];

export default function MarketDashboard() {
    const { token } = useAuth();
    // Initialize with default tickers
    const [watchedTickers, setWatchedTickers] = useState<string[]>(['FDX', 'UPS', 'XPO', 'CHRW', 'EXPD']);
    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(true);
    const [showAllCompanies, setShowAllCompanies] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const ticker = searchQuery.toUpperCase().trim();

        // Check if already exists
        if (watchedTickers.includes(ticker)) {
            setSearchError(`Company ${ticker} is already in your watch list.`);
            return;
        }

        setSearchLoading(true);
        setSearchError('');

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/market/company/${ticker}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success && response.data.data) {
                const newCompany = response.data.data;
                // Add to list
                setWatchedTickers(prev => [...prev, ticker]);
                setCompanies(prev => [...prev, newCompany]);
                setSelectedCompany(newCompany); // Auto select new company
                setSearchQuery('');
                setShowAllCompanies(true); // Expand list to see new item
            } else {
                setSearchError(`Could not find market data for ${ticker}`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchError(`Failed to fetch data for ${ticker}. Please check the symbol.`);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCompanies();
        fetchNews();
    }, []);

    const fetchAllCompanies = async () => {
        setLoading(true);
        const results: CompanyData[] = [];

        for (const ticker of watchedTickers) {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/market/company/${ticker}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    results.push(response.data.data);
                }
            } catch (error) {
                console.error(`Failed to fetch ${ticker}:`, error);
            }
        }

        setCompanies(results);
        if (results.length > 0) {
            setSelectedCompany(results[0]);
        }
        setLoading(false);
    };

    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/market/news`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setNews(response.data.data.articles || []);
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        }
        setNewsLoading(false);
    };

    const formatMarketCap = (cap: number) => {
        if (cap >= 1000) return `$${(cap / 1000).toFixed(1)}B`;
        return `$${cap.toFixed(0)}M`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/ai" className={styles.backBtn}>
                    ← Back to Agent Studio
                </Link>
                <div className={styles.headerCenter}>
                    <span className={styles.headerIcon}>📊</span>
                    <h1>Market Intelligence</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.dataSource}>Powered by Finnhub</span>
                </div>
            </header>

            <div className={styles.content}>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Enter Stock Symbol (e.g., AAPL, MSFT, AMZN)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        type="submit"
                        className={styles.searchButton}
                        disabled={searchLoading}
                    >
                        {searchLoading ? 'Adding...' : 'Add to Watch'}
                    </button>
                </form>

                {searchError && (
                    <div className={styles.errorMessage}>
                        ⚠️ {searchError}
                    </div>
                )}

                {/* Company Watch Section */}
                <section className={styles.companySection}>
                    <h2 className={styles.sectionTitle}>Company Watch</h2>

                    {loading ? (
                        <div className={styles.loadingGrid}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={styles.skeleton}></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className={styles.companyGrid}>
                                {companies.slice(0, showAllCompanies ? undefined : 3).map((company) => (
                                    <div
                                        key={company.ticker}
                                        className={`${styles.companyCard} ${selectedCompany?.ticker === company.ticker ? styles.selected : ''}`}
                                        onClick={() => setSelectedCompany(company)}
                                    >
                                        <div className={styles.cardHeader}>
                                            {company.logo && (
                                                <img src={company.logo} alt={company.name} className={styles.companyLogo} />
                                            )}
                                            <div className={styles.cardTicker}>{company.ticker}</div>
                                        </div>
                                        <div className={styles.cardPrice}>
                                            ${company.quote?.current?.toFixed(2) || 'N/A'}
                                        </div>
                                        <div className={`${styles.cardChange} ${(company.quote?.percentChange || 0) >= 0 ? styles.positive : styles.negative}`}>
                                            {(company.quote?.percentChange || 0) >= 0 ? '▲' : '▼'} {Math.abs(company.quote?.percentChange || 0).toFixed(2)}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {companies.length > 3 && (
                                <div className={styles.toggleBtnContainer}>
                                    <button
                                        className={styles.toggleBtn}
                                        onClick={() => setShowAllCompanies(!showAllCompanies)}
                                    >
                                        {showAllCompanies ? 'Show Less' : `Show ${companies.length - 3} More`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* Detailed View */}
                {selectedCompany && (
                    <section className={styles.detailSection}>
                        <h2 className={styles.sectionTitle}>
                            {selectedCompany.name || selectedCompany.ticker} Details
                        </h2>

                        <div className={styles.detailGrid}>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Current Price</span>
                                <span className={styles.detailValue}>
                                    ${selectedCompany.quote?.current?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Market Cap</span>
                                <span className={styles.detailValue}>
                                    {formatMarketCap(selectedCompany.marketCap || 0)}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Day High</span>
                                <span className={styles.detailValue}>
                                    ${selectedCompany.quote?.high?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Day Low</span>
                                <span className={styles.detailValue}>
                                    ${selectedCompany.quote?.low?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Open</span>
                                <span className={styles.detailValue}>
                                    ${selectedCompany.quote?.open?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Prev Close</span>
                                <span className={styles.detailValue}>
                                    ${selectedCompany.quote?.previousClose?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.chartContainer}>
                            <MarketChart company={selectedCompany} />
                        </div>
                    </section>
                )}

                {/* News Feed */}
                <section className={styles.newsSection}>
                    <h2 className={styles.sectionTitle}>Industry News</h2>

                    {newsLoading ? (
                        <div className={styles.newsLoading}>Loading news...</div>
                    ) : news.length === 0 ? (
                        <div className={styles.noNews}>No logistics news available</div>
                    ) : (
                        <div className={styles.newsGrid}>
                            {news.map((article) => {
                                const isNew = (Date.now() / 1000 - article.datetime) < 86400; // Less than 24 hours
                                return (
                                    <a
                                        key={article.id}
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.newsCard}
                                    >
                                        <div className={styles.newsImageContainer}>
                                            {article.image ? (
                                                <img src={article.image} alt="" className={styles.newsImage} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1a1a2e, #16213e)' }}></div>
                                            )}
                                            {isNew && <span className={styles.newsBadge}>NEW</span>}
                                        </div>
                                        <div className={styles.newsContent}>
                                            <h3 className={styles.newsTitle}>{article.title}</h3>
                                            <p className={styles.newsSummary}>{article.summary?.slice(0, 150)}...</p>
                                            <div className={styles.newsMeta}>
                                                <span className={styles.newsSource}>
                                                    📰 {article.source}
                                                </span>
                                                <span className={styles.newsDate}>{formatDate(article.datetime)}</span>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function MarketChart({ company }: { company: CompanyData }) {
    // Generate mock historical data based on current price trend
    const generateData = () => {
        const points = 7; // 7 days
        const labels = Array.from({ length: points }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (points - 1 - i));
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        const currentPrice = company.quote.current;
        const trend = company.quote.percentChange >= 0 ? 1 : -1;
        const volatility = 0.02; // 2% daily volatility

        const prices = [];
        let price = currentPrice * (1 - (trend * 0.05)); // Start 5% away

        for (let i = 0; i < points - 1; i++) {
            prices.push(price);
            // Random movement with trend bias
            const move = (Math.random() - 0.4 + (trend * 0.1)) * volatility;
            price = price * (1 + move);
        }
        prices.push(currentPrice); // Ensure it ends at current

        return { labels, prices };
    };

    const { labels, prices } = generateData();
    const isPositive = company.quote.percentChange >= 0;

    const data = {
        labels,
        datasets: [
            {
                label: 'Price',
                data: prices,
                borderColor: isPositive ? '#00d26a' : '#ff4757',
                backgroundColor: (context: ScriptableContext<'line'>) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, isPositive ? 'rgba(0, 210, 106, 0.5)' : 'rgba(255, 71, 87, 0.5)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(20, 20, 35, 0.9)',
                titleColor: '#fff',
                bodyColor: '#ccc',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#888',
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#888',
                    callback: (value: any) => '$' + value.toFixed(0),
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}
