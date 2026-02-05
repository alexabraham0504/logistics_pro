'use client';

import { useState, useEffect, useCallback } from 'react';
import { exportAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiArrowLeft, FiPackage, FiPlus, FiFileText, FiCheck,
    FiClock, FiMapPin, FiLink, FiSearch, FiFilter,
    FiAnchor, FiGlobe, FiTruck, FiChevronRight
} from 'react-icons/fi';
import styles from './exports.module.css';

interface ExportRecord {
    _id: string;
    exportId: string;
    exportType: string;
    status: string;
    exportDetails: {
        exporterName: string;
        importerName: string;
        importerCountry: string;
        productDescription: string;
        value: number;
        currency: string;
    };
    blockchainMetadata: {
        totalBlocks: number;
        currentHash: string;
        lastUpdated: string;
    };
    documents: Array<{
        _id: string;
        documentType: string;
        documentHash: string;
        isVerified: boolean;
    }>;
    statusHistory: Array<{
        status: string;
        timestamp: string;
        location: string;
        blockchainHash: string;
    }>;
    createdAt: string;
}

interface BlockchainTrace {
    exportId: string;
    blockchainTrace: Array<{
        _id: string;
        eventType: string;
        eventData: any;
        blockchainData: {
            hash: string;
            previousHash: string;
            blockNumber: number;
            timestamp: string;
        };
    }>;
    chainIntegrity: {
        isValid: boolean;
        message: string;
    };
}

export default function ExportTrackingPage() {
    const [exports, setExports] = useState<ExportRecord[]>([]);
    const [selectedExport, setSelectedExport] = useState<ExportRecord | null>(null);
    const [blockchainTrace, setBlockchainTrace] = useState<BlockchainTrace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchExports = useCallback(async () => {
        setIsLoading(true);
        console.log('🔄 [Export] Fetching exports...');
        try {
            const params: any = { limit: 50 };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            console.log('🔄 [Export] Params:', params);
            const response = await exportAPI.getList(params);
            console.log('✅ [Export] Response:', response.data);
            setExports(response.data.data.exports || []);
        } catch (err: any) {
            console.error('❌ [Export] Fetch error:', err);
            console.error('❌ [Export] Error response:', err.response);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        console.log('🔄 [Export] Component mounted/updated');
        fetchExports();
    }, [fetchExports]);

    const selectExport = async (exportItem: ExportRecord) => {
        setSelectedExport(exportItem);
        setIsLoadingDetails(true);

        try {
            const [detailsRes, traceRes] = await Promise.all([
                exportAPI.getById(exportItem._id),
                exportAPI.getBlockchainTrace(exportItem._id)
            ]);

            setSelectedExport(detailsRes.data.data);
            setBlockchainTrace(traceRes.data.data);
        } catch (err) {
            console.error('Failed to fetch export details:', err);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '-';
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            preparing: '#6b7280',
            documentation_pending: '#f59e0b',
            customs_clearance: '#8b5cf6',
            at_port: '#3b82f6',
            in_transit: '#06b6d4',
            arrived_destination: '#10b981',
            delivered: '#059669',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const getExportTypeIcon = (type: string) => {
        switch (type) {
            case 'sea': return <FiAnchor size={18} />;
            case 'air': return <FiGlobe size={18} />;
            case 'land': return <FiTruck size={18} />;
            default: return <FiPackage size={18} />;
        }
    };

    const getEventTypeLabel = (eventType: string) => {
        const labels: Record<string, string> = {
            export_created: 'Export Created',
            document_upload: 'Document Uploaded',
            status_update: 'Status Updated',
            customs_clearance: 'Customs Cleared',
            port_departure: 'Port Departure',
            port_arrival: 'Port Arrival',
            delivery_complete: 'Delivery Complete'
        };
        return labels[eventType] || eventType;
    };

    const filteredExports = exports.filter(exp =>
        exp.exportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.exportDetails?.exporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.exportDetails?.importerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/blockchain" className={styles.backBtn}>
                    <FiArrowLeft size={20} />
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiPackage size={32} />
                    </div>
                    <div>
                        <h1>Export Tracking</h1>
                        <p>Document management and blockchain traceability</p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search exports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterBox}>
                    <FiFilter size={16} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="preparing">Preparing</option>
                        <option value="documentation_pending">Documentation Pending</option>
                        <option value="customs_clearance">Customs Clearance</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                    </select>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Export List */}
                <div className={styles.exportList}>
                    <div className={styles.listHeader}>
                        <h3>Exports</h3>
                        <span className={styles.count}>{filteredExports.length}</span>
                    </div>

                    {isLoading ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : filteredExports.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiPackage size={32} />
                            <p>No exports found</p>
                        </div>
                    ) : (
                        <div className={styles.exportGrid}>
                            {filteredExports.map((exp) => (
                                <button
                                    key={exp._id}
                                    className={`${styles.exportCard} ${selectedExport?._id === exp._id ? styles.selected : ''}`}
                                    onClick={() => selectExport(exp)}
                                >
                                    <div className={styles.exportCardHeader}>
                                        <div className={styles.exportType}>
                                            {getExportTypeIcon(exp.exportType)}
                                        </div>
                                        <div className={styles.exportInfo}>
                                            <span className={styles.exportId}>{exp.exportId}</span>
                                            <span className={styles.exportCountry}>
                                                {exp.exportDetails?.importerCountry}
                                            </span>
                                        </div>
                                        <FiChevronRight className={styles.chevron} />
                                    </div>
                                    <div className={styles.exportCardBody}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: `${getStatusColor(exp.status)}20`, color: getStatusColor(exp.status) }}
                                        >
                                            {exp.status.replace('_', ' ')}
                                        </span>
                                        <span className={styles.blockCount}>
                                            <FiLink size={12} />
                                            {exp.blockchainMetadata?.totalBlocks || 0} blocks
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Export Details */}
                <div className={styles.exportDetails}>
                    {!selectedExport ? (
                        <div className={styles.selectPrompt}>
                            <FiPackage size={48} />
                            <h3>Select an export</h3>
                            <p>Choose an export from the list to view details and blockchain trace</p>
                        </div>
                    ) : isLoadingDetails ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Export Header */}
                            <div className={styles.detailsHeader}>
                                <div>
                                    <h2>{selectedExport.exportId}</h2>
                                    <span className={styles.exportTypeBadge}>
                                        {getExportTypeIcon(selectedExport.exportType)}
                                        {selectedExport.exportType.toUpperCase()} FREIGHT
                                    </span>
                                </div>
                                <span
                                    className={styles.statusLarge}
                                    style={{ backgroundColor: getStatusColor(selectedExport.status) }}
                                >
                                    {selectedExport.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Export Info Grid */}
                            <div className={styles.infoGrid}>
                                <div className={styles.infoCard}>
                                    <h4>Exporter</h4>
                                    <p>{selectedExport.exportDetails?.exporterName || '-'}</p>
                                </div>
                                <div className={styles.infoCard}>
                                    <h4>Importer</h4>
                                    <p>{selectedExport.exportDetails?.importerName || '-'}</p>
                                    <span className={styles.country}>
                                        {selectedExport.exportDetails?.importerCountry}
                                    </span>
                                </div>
                                <div className={styles.infoCard}>
                                    <h4>Product</h4>
                                    <p>{selectedExport.exportDetails?.productDescription || '-'}</p>
                                </div>
                                <div className={styles.infoCard}>
                                    <h4>Value</h4>
                                    <p className={styles.value}>
                                        {selectedExport.exportDetails?.currency} {selectedExport.exportDetails?.value?.toLocaleString() || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className={styles.documentsSection}>
                                <h3><FiFileText size={18} /> Documents</h3>
                                {selectedExport.documents?.length === 0 ? (
                                    <p className={styles.noData}>No documents uploaded</p>
                                ) : (
                                    <div className={styles.documentGrid}>
                                        {selectedExport.documents?.map((doc) => (
                                            <div key={doc._id} className={styles.documentCard}>
                                                <FiFileText className={styles.docIcon} />
                                                <span className={styles.docType}>{doc.documentType.replace('_', ' ')}</span>
                                                <code className={styles.docHash}>{truncateHash(doc.documentHash)}</code>
                                                <span className={doc.isVerified ? styles.verified : styles.pending}>
                                                    {doc.isVerified ? <FiCheck /> : <FiClock />}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Blockchain Trace */}
                            <div className={styles.blockchainSection}>
                                <div className={styles.blockchainHeader}>
                                    <h3><FiLink size={18} /> Blockchain Trace</h3>
                                    {blockchainTrace?.chainIntegrity && (
                                        <span className={blockchainTrace.chainIntegrity.isValid ? styles.chainValid : styles.chainInvalid}>
                                            {blockchainTrace.chainIntegrity.isValid ? 'Chain Valid' : 'Chain Invalid'}
                                        </span>
                                    )}
                                </div>

                                {blockchainTrace?.blockchainTrace?.length === 0 ? (
                                    <p className={styles.noData}>No blockchain records</p>
                                ) : (
                                    <div className={styles.timeline}>
                                        {blockchainTrace?.blockchainTrace?.map((block, index) => (
                                            <div key={block._id} className={styles.timelineItem}>
                                                <div className={styles.timelineNode}>
                                                    <div className={styles.nodeDot}></div>
                                                    {index < (blockchainTrace?.blockchainTrace?.length || 0) - 1 && (
                                                        <div className={styles.nodeLine}></div>
                                                    )}
                                                </div>
                                                <div className={styles.timelineContent}>
                                                    <div className={styles.timelineHeader}>
                                                        <span className={styles.eventType}>
                                                            {getEventTypeLabel(block.eventType)}
                                                        </span>
                                                        <span className={styles.blockNumber}>
                                                            Block #{block.blockchainData.blockNumber}
                                                        </span>
                                                    </div>
                                                    <span className={styles.timelineTime}>
                                                        {formatDate(block.blockchainData.timestamp)}
                                                    </span>
                                                    <code className={styles.timelineHash}>
                                                        {truncateHash(block.blockchainData.hash)}
                                                    </code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
