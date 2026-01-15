'use client';

import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { FiTrendingUp, FiClock, FiTruck, FiDownload } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import styles from './reports.module.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function ReportsPage() {
    const [kpis, setKpis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        fetchKPIs();
    }, []);

    const fetchKPIs = async () => {
        try {
            const response = await reportsAPI.getKPI();
            setKpis(response.data.data);
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (type: string) => {
        try {
            const response = await reportsAPI.exportReport(type);
            alert(`Export ready: ${response.data.data.count} records`);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    // Chart data
    const revenueChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue (₹)',
            data: [45000, 52000, 48000, 61000, 55000, 67000],
            fill: true,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
        }]
    };

    const shipmentsChartData = {
        labels: ['Pending', 'In Transit', 'Delivered', 'Failed'],
        datasets: [{
            data: [15, 35, 120, 5],
            backgroundColor: ['#f59e0b', '#0066ff', '#10b981', '#ef4444'],
            borderWidth: 0,
        }]
    };

    const ordersBarData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Orders',
            data: [28, 45, 38, 52, 48, 35, 22],
            backgroundColor: 'rgba(0, 102, 255, 0.8)',
            borderRadius: 6,
        }]
    };

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <div className="spinner"></div>
                <p>Loading reports...</p>
            </div>
        );
    }

    return (
        <div>
            <header className="header">
                <div className="header-title">
                    <h1>Reports & Analytics</h1>
                    <p>KPI monitoring and business intelligence</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => handleExport('orders')} className="btn btn-outline">
                        <FiDownload size={18} /> Export Orders
                    </button>
                    <button onClick={() => handleExport('invoices')} className="btn btn-outline">
                        <FiDownload size={18} /> Export Invoices
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="stats-grid mb-6">
                <div className={`stat-card ${styles.kpiCard}`}>
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <FiTrendingUp size={24} color="white" />
                    </div>
                    <div className="stat-card-value">{kpis?.otifRate || 0}%</div>
                    <div className="stat-card-label">OTIF Rate</div>
                    <span className={styles.kpiDescription}>On-Time In-Full Delivery</span>
                </div>
                <div className={`stat-card ${styles.kpiCard}`}>
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
                        <FaRupeeSign size={24} color="white" />
                    </div>
                    <div className="stat-card-value">₹{kpis?.avgCostPerShipment || 0}</div>
                    <div className="stat-card-label">Avg Cost/Shipment</div>
                    <span className={styles.kpiDescription}>Shipping cost efficiency</span>
                </div>
                <div className={`stat-card ${styles.kpiCard}`}>
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        <FiTruck size={24} color="white" />
                    </div>
                    <div className="stat-card-value">{kpis?.fleetUtilization || 0}%</div>
                    <div className="stat-card-label">Fleet Utilization</div>
                    <span className={styles.kpiDescription}>Vehicles in active use</span>
                </div>
                <div className={`stat-card ${styles.kpiCard}`}>
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <FiClock size={24} color="white" />
                    </div>
                    <div className="stat-card-value">{kpis?.orderFulfillmentRate || 0}%</div>
                    <div className="stat-card-label">Fulfillment Rate</div>
                    <span className={styles.kpiDescription}>Orders successfully completed</span>
                </div>
            </div>

            {/* Charts */}
            <div className="grid-2 mb-6">
                <div className="card">
                    <h3 className="mb-4">Revenue Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card">
                    <h3 className="mb-4">Shipment Status Distribution</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={shipmentsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="mb-4">Weekly Order Volume</h3>
                <div style={{ height: '300px' }}>
                    <Bar data={ordersBarData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </div>

            {/* Summary Metrics */}
            <div className={`card mt-6 ${styles.summaryCard}`}>
                <h3 className="mb-4">Performance Summary</h3>
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{kpis?.totalDeliveries || 0}</span>
                        <span className={styles.summaryLabel}>Total Deliveries</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{kpis?.onTimeDeliveries || 0}</span>
                        <span className={styles.summaryLabel}>On-Time Deliveries</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryValue}>{((kpis?.onTimeDeliveries / kpis?.totalDeliveries) * 100 || 0).toFixed(1)}%</span>
                        <span className={styles.summaryLabel}>Success Rate</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
