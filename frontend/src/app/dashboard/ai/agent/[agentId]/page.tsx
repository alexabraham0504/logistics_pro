'use client';

import { useParams } from 'next/navigation';
import MarketDashboard from '../../components/MarketDashboard';
import TrackingView from '../../components/TrackingView';
import ZoneHeatmap from '../../components/ZoneHeatmap';
import CarrierWizard from '../../components/CarrierWizard';
import ContractView from '../../components/ContractView';
import Link from 'next/link';

export default function AgentPage() {
    const params = useParams();
    const agentId = (params.agentId as string).toLowerCase();

    // Render the specific component based on the agentId
    switch (agentId) {
        case 'market':
            return <MarketDashboard />;
        case 'tracking':
        case 'shipment': // Handle alias
            return <TrackingView />;
        case 'zone':
            return <ZoneHeatmap />;
        case 'carrier':
            return <CarrierWizard />;
        case 'contract':
            return <ContractView />;

        // Fallback for agents without a specific dashboard yet
        case 'fleet':
        case 'inventory':
        case 'logistics':
        case 'support':
        default:
            return (
                <div style={{
                    padding: '3rem',
                    color: '#fff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#09090b'
                }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent
                    </h1>
                    <p style={{ color: '#a1a1aa', marginBottom: '2rem', fontSize: '1.2rem' }}>
                        The specialized dashboard for this agent is under construction.
                    </p>
                    <Link
                        href="/dashboard/ai"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#27272a',
                            color: '#fff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            border: '1px solid #3f3f46',
                            transition: 'all 0.2s'
                        }}
                    >
                        ← Return to Agent Studio
                    </Link>
                </div>
            );
    }
}
