'use client';

import { useParams } from 'next/navigation';
import MarketDashboard from '../../components/MarketDashboard';
import TrackingView from '../../components/TrackingView';
import ZoneHeatmap from '../../components/ZoneHeatmap';
import CarrierWizard from '../../components/CarrierWizard';
import ContractView from '../../components/ContractView';
import Link from 'next/link';

import { FiTruck, FiPackage, FiCpu } from 'react-icons/fi';
import PremiumPlaceholder from '../../components/PremiumPlaceholder';
import SupportView from '../../components/SupportView';

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
        case 'fleet':
            return <PremiumPlaceholder agentName="Fleet Optimizer" icon={<FiTruck />} />;
        case 'inventory':
            return <PremiumPlaceholder agentName="Inventory Analyst" icon={<FiPackage />} />;
        case 'logistics':
        case 'support':
            return <SupportView />;

        default:
            return <PremiumPlaceholder agentName={`${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent`} icon={<FiCpu />} />;
    }
}
