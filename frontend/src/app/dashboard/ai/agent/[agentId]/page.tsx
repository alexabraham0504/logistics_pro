'use client';

import { useParams } from 'next/navigation';
import MarketDashboard from '../../components/MarketDashboard';
import TrackingView from '../../components/TrackingView';
import ZoneHeatmap from '../../components/ZoneHeatmap';
import CarrierWizard from '../../components/CarrierWizard';
import ContractView from '../../components/ContractView';
import Link from 'next/link';

import { FiTruck, FiPackage, FiCpu } from 'react-icons/fi';
import AiAgentWrapper from '../../components/AiAgentWrapper';
import PremiumPlaceholder from '../../components/PremiumPlaceholder';
import SupportView from '../../components/SupportView';

export default function AgentPage() {
    const params = useParams();
    const agentId = (params.agentId as string).toLowerCase();

    const getAgentComponent = () => {
        switch (agentId) {
            case 'market':
                return <MarketDashboard />;
            case 'tracking':
            case 'shipment':
                return <TrackingView />;
            case 'zone':
                return <ZoneHeatmap />;
            case 'carrier':
                return <CarrierWizard />;
            case 'contract':
                return <ContractView />;
            case 'fleet':
                return <PremiumPlaceholder agentName="Fleet Optimizer" agentId="fleet" icon={<FiTruck />} />;
            case 'inventory':
                return <PremiumPlaceholder agentName="Inventory Analyst" agentId="inventory" icon={<FiPackage />} />;
            case 'logistics':
            case 'support':
                return <SupportView />;
            default:
                return <PremiumPlaceholder agentName={`${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent`} agentId={agentId} icon={<FiCpu />} />;
        }
    };

    const agentNames: { [key: string]: string } = {
        'market': 'Market Intelligence',
        'tracking': 'Shipment Tracking',
        'shipment': 'Shipment Tracking',
        'zone': 'Zone Heatmap',
        'carrier': 'Carrier Wizard',
        'contract': 'Contract Intel',
        'contract-intel': 'Contract Intel',
        'fleet': 'Fleet Optimizer',
        'inventory': 'Inventory Analyst',
        'logistics': 'Logistics Assistant',
        'support': 'Logistics Assistant'
    };

    return (
        <AiAgentWrapper agentName={agentNames[agentId]}>
            {getAgentComponent()}
        </AiAgentWrapper>
    );
}

