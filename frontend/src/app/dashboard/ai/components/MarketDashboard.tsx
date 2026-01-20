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

interface CandleData {
    dates: string[];
    close: number[];
    volume: number[];
    high: number[];
    low: number[];
    open: number[];
    source?: 'finnhub' | 'mock';
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
    const [candleData, setCandleData] = useState<CandleData | null>(null);
    const [candleLoading, setCandleLoading] = useState(false);
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

    // Fetch historical candle data when company is selected
    const fetchCandleData = async (ticker: string) => {
        setCandleLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/market/candles/${ticker}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success && response.data.data.candles) {
                const candles = response.data.data.candles;
                // If API returned source info, use it. Otherwise Finnhub is default if not explicitly mock
                if (response.data.data.source) {
                    candles.source = response.data.data.source;
                }
                setCandleData(candles);
            } else {
                setCandleData(null);
            }
        } catch (error) {
            console.error('Failed to fetch candle data:', error);
            setCandleData(null);
        }
        setCandleLoading(false);
    };

    // Fetch candles when selected company changes
    useEffect(() => {
        if (selectedCompany?.ticker) {
            fetchCandleData(selectedCompany.ticker);
        }
    }, [selectedCompany?.ticker]);

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
                    <span className={styles.dataSource}>Powered by Finnhub & Yahoo Finance</span>
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
                                            <div className={styles.companyInfo}>
                                                <h3 className={styles.companyName}>{company.name || company.ticker}</h3>
                                                <span className={styles.companyCategory}>{company.sector || 'Logistics'}</span>
                                            </div>
                                        </div>
                                        <span className={styles.viewDetails}>
                                            View details →
                                        </span>
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
                        {/* Company Header */}
                        <div className={styles.detailHeader}>
                            {selectedCompany.logo && (
                                <img src={selectedCompany.logo} alt={selectedCompany.name} className={styles.detailLogo} />
                            )}
                            <h2 className={styles.detailCompanyName}>{selectedCompany.name || selectedCompany.ticker}</h2>
                            <span className={styles.detailCategory}>{selectedCompany.sector || 'Logistics'}</span>

                            <div className={styles.detailQuickStats}>
                                <div className={styles.quickStat}>
                                    <span className={styles.quickLabel}>Market Cap</span>
                                    <span className={styles.quickValue}>{formatMarketCap(selectedCompany.marketCap || 0)}</span>
                                </div>
                                <div className={styles.quickStat}>
                                    <span className={styles.quickLabel}>Change</span>
                                    <span className={`${styles.quickValue} ${(selectedCompany.quote?.percentChange || 0) >= 0 ? styles.positive : styles.negative}`}>
                                        {(selectedCompany.quote?.percentChange || 0) >= 0 ? '+' : ''}{selectedCompany.quote?.percentChange?.toFixed(2) || '0'}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={styles.descriptionBlock}>
                            <h4 className={styles.descriptionTitle}>Description</h4>
                            <p className={styles.descriptionText}>
                                {selectedCompany.name || selectedCompany.ticker} is a global leader in the logistics and transportation industry,
                                providing innovative supply chain solutions worldwide.
                            </p>
                        </div>

                        {/* Overview Tab */}
                        <div className={styles.overviewTab}>
                            <span className={styles.tabActive}>Overview</span>
                        </div>

                        {/* Stats Grid */}
                        <div className={styles.detailGrid}>
                            <div className={styles.detailCard}>
                                <div className={styles.detailCardHeader}>
                                    <span className={styles.detailLabel}>Stock Price</span>
                                    <span className={styles.detailIcon}>💲</span>
                                </div>
                                <span className={styles.detailValue}>
                                    $ {selectedCompany.quote?.current?.toFixed(2) || 'N/A'}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <div className={styles.detailCardHeader}>
                                    <span className={styles.detailLabel}>Market Cap</span>
                                    <span className={styles.detailIcon}>📈</span>
                                </div>
                                <span className={styles.detailValue}>
                                    {formatMarketCap(selectedCompany.marketCap || 0)}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <div className={styles.detailCardHeader}>
                                    <span className={styles.detailLabel}>P/E Ratio</span>
                                    <span className={styles.detailIcon}>📊</span>
                                </div>
                                <span className={styles.detailValue}>
                                    {((selectedCompany.quote?.current || 0) / 15).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Charts Section - Two Charts Side by Side */}
                        <div className={styles.chartsGrid}>
                            <div className={styles.chartBlock}>
                                <h4 className={styles.chartTitle}>Price Trend</h4>
                                <p className={styles.chartSubtitle}>Historical stock price movement</p>
                                <div className={styles.chartContainer}>
                                    {candleLoading ? (
                                        <div className={styles.chartLoading}>Loading chart data...</div>
                                    ) : (
                                        <MarketChart company={selectedCompany} type="price" candleData={candleData} />
                                    )}
                                </div>
                                <span className={styles.chartFooter}>
                                    {selectedCompany.quote?.percentChange >= 0 ? '+' : ''}
                                    {selectedCompany.quote?.percentChange?.toFixed(2) || '0'}% trend
                                </span>
                            </div>
                            <div className={styles.chartBlock}>
                                <h4 className={styles.chartTitle}>Volume Trend</h4>
                                <p className={styles.chartSubtitle}>Historical trading volume</p>
                                <div className={styles.chartContainer}>
                                    {candleLoading ? (
                                        <div className={styles.chartLoading}>Loading chart data...</div>
                                    ) : (
                                        <MarketChart company={selectedCompany} type="volume" candleData={candleData} />
                                    )}
                                </div>
                                <span className={styles.chartFooter}>Trading volume data</span>
                            </div>
                        </div>
                    </section>
                )}


            </div>
        </div>
    );
}

function MarketChart({
    company,
    type = 'price',
    candleData
}: {
    company: CompanyData;
    type?: 'price' | 'volume';
    candleData?: CandleData | null;
}) {
    // Use real candle data if available, otherwise generate mock data
    const getData = () => {
        if (candleData && candleData.dates && candleData.dates.length > 0) {
            // Use real data from API
            if (type === 'volume') {
                return {
                    labels: candleData.dates,
                    data: candleData.volume
                };
            } else {
                return {
                    labels: candleData.dates,
                    data: candleData.close
                };
            }
        }

        // Fallback to mock data if no candle data
        const labels = ['07/22', '11/22', '03/23', '07/23', '11/23', '03/24', '07/24', '11/24', '04/25'];

        if (type === 'volume') {
            const volumes = Array.from({ length: labels.length }, () =>
                Math.floor(5000000 + Math.random() * 10000000)
            );
            return { labels, data: volumes };
        } else {
            const currentPrice = company.quote?.current || 200;
            const prices = [];
            let price = currentPrice * 0.7;

            for (let i = 0; i < labels.length; i++) {
                prices.push(price);
                price = price * (1 + (Math.random() - 0.3) * 0.15);
            }
            return { labels, data: prices };
        }
    };

    const { labels, data } = getData();
    const isVolume = type === 'volume';

    const chartData = {
        labels,
        datasets: [
            {
                label: isVolume ? 'Volume' : 'Price',
                data: data,
                borderColor: isVolume ? '#22c55e' : '#3b82f6',
                backgroundColor: (context: ScriptableContext<'line'>) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    if (isVolume) {
                        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
                        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
                    } else {
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                    }
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBackgroundColor: isVolume ? '#22c55e' : '#3b82f6',
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
                backgroundColor: 'rgba(10, 10, 10, 0.9)',
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
                },
                ticks: {
                    color: '#666',
                    font: { size: 9 },
                    maxTicksLimit: 8,
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#666',
                    font: { size: 9 },
                    callback: (value: any) => isVolume
                        ? (value / 1000000).toFixed(1) + 'M'
                        : '$' + value.toFixed(0),
                },
            },
        },
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Line data={chartData} options={options} />
            {candleData?.source && (
                <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '10px',
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: candleData.source === 'finnhub' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 140, 0, 0.2)',
                    color: candleData.source === 'finnhub' ? '#22c55e' : '#ff8c00',
                    border: `1px solid ${candleData.source === 'finnhub' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 140, 0, 0.3)'}`,
                    pointerEvents: 'none'
                }}>
                    {candleData.source === 'finnhub' ? '● Live Data' : '○ Simulated'}
                </div>
            )}
        </div>
    );
}
