'use client';

import { useState, useEffect, useCallback } from 'react';
import { vahakAPI, fleetAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiArrowLeft, FiTruck, FiUser, FiShield, FiCheck,
    FiX, FiClock, FiPhone, FiMail, FiHash, FiLink
} from 'react-icons/fi';
import styles from './vahak.module.css';

interface VahakVehicle {
    id: string;
    vehicleNumber: string;
    type: string;
    owner?: string;
    ownerPhone?: string;
    verificationStatus?: string;
    blockchainHash?: string;
}

interface VahakDetails {
    vehicle: {
        id: string;
        vehicleNumber: string;
        type: string;
    };
    vahakDetails: {
        ownerName: string;
        ownerPhone: string;
        ownerEmail: string;
        ownerAadhar: string;
        ownerPAN: string;
        ownerAddress: {
            street: string;
            city: string;
            state: string;
        };
        ownershipType: string;
        verificationStatus: string;
        verifiedAt: string;
        blockchainHash: string;
    };
    blockchainTracking: {
        vehicleHash: string;
        totalTrips: number;
        blockchainRecordCount: number;
        lastBlockUpdate: string;
    };
}

export default function VahakPage() {
    const [vehicles, setVehicles] = useState<VahakVehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [vahakDetails, setVahakDetails] = useState<VahakDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await vahakAPI.getList({ limit: 50 });
            setVehicles(response.data.data.vehicles || []);
        } catch (err) {
            console.error('Failed to fetch vehicles:', err);
            // Fallback: try to get all vehicles
            try {
                const fleetRes = await fleetAPI.getVehicles({ limit: 50 });
                setVehicles(fleetRes.data.data.vehicles.map((v: any) => ({
                    id: v._id,
                    vehicleNumber: v.vehicleNumber,
                    type: v.type,
                    owner: v.vahakDetails?.ownerName,
                    ownerPhone: v.vahakDetails?.ownerPhone,
                    verificationStatus: v.vahakDetails?.verificationStatus,
                    blockchainHash: v.vahakDetails?.blockchainHash
                })));
            } catch (e) {
                console.error('Failed to fetch fleet vehicles:', e);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const selectVehicle = async (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        setIsLoadingDetails(true);

        try {
            const response = await vahakAPI.getByVehicle(vehicleId);
            setVahakDetails(response.data.data);
        } catch (err) {
            console.error('Failed to fetch vahak details:', err);
            setVahakDetails(null);
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <FiCheck className={styles.verified} />;
            case 'rejected':
                return <FiX className={styles.rejected} />;
            default:
                return <FiClock className={styles.pending} />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'verified': return styles.statusVerified;
            case 'rejected': return styles.statusRejected;
            default: return styles.statusPending;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/blockchain" className={styles.backBtn}>
                    <FiArrowLeft size={20} />
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <FiTruck size={32} />
                    </div>
                    <div>
                        <h1>Vehicle Owners (Vahak)</h1>
                        <p>Owner registration and blockchain verification</p>
                    </div>
                </div>
            </header>

            <div className={styles.mainGrid}>
                {/* Vehicle List */}
                <div className={styles.vehicleList}>
                    <h3>Registered Vehicles</h3>

                    {isLoading ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiTruck size={32} />
                            <p>No vehicles with Vahak details found</p>
                        </div>
                    ) : (
                        <div className={styles.vehicleGrid}>
                            {vehicles.map((vehicle) => (
                                <button
                                    key={vehicle.id}
                                    className={`${styles.vehicleCard} ${selectedVehicle === vehicle.id ? styles.selected : ''}`}
                                    onClick={() => selectVehicle(vehicle.id)}
                                >
                                    <div className={styles.vehicleIcon}>
                                        <FiTruck size={20} />
                                    </div>
                                    <div className={styles.vehicleInfo}>
                                        <span className={styles.vehicleNumber}>
                                            {vehicle.vehicleNumber}
                                        </span>
                                        <span className={styles.vehicleType}>
                                            {vehicle.type}
                                        </span>
                                    </div>
                                    {vehicle.owner && (
                                        <span className={getStatusClass(vehicle.verificationStatus || 'pending')}>
                                            {getStatusIcon(vehicle.verificationStatus || 'pending')}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Vahak Details */}
                <div className={styles.vahakDetails}>
                    {!selectedVehicle ? (
                        <div className={styles.selectPrompt}>
                            <FiUser size={48} />
                            <h3>Select a vehicle</h3>
                            <p>Choose a vehicle to view owner details</p>
                        </div>
                    ) : isLoadingDetails ? (
                        <div className={styles.loading}>
                            <div className="spinner"></div>
                        </div>
                    ) : !vahakDetails ? (
                        <div className={styles.noOwner}>
                            <FiUser size={48} />
                            <h3>No Owner Registered</h3>
                            <p>This vehicle does not have Vahak details registered</p>
                        </div>
                    ) : (
                        <>
                            {/* Vehicle Header */}
                            <div className={styles.detailsHeader}>
                                <div className={styles.vehicleHeaderInfo}>
                                    <h2>{vahakDetails.vehicle.vehicleNumber}</h2>
                                    <span className={styles.vehicleTypeBadge}>
                                        {vahakDetails.vehicle.type}
                                    </span>
                                </div>
                                <span className={getStatusClass(vahakDetails.vahakDetails.verificationStatus)}>
                                    {getStatusIcon(vahakDetails.vahakDetails.verificationStatus)}
                                    <span>{vahakDetails.vahakDetails.verificationStatus}</span>
                                </span>
                            </div>

                            {/* Owner Info */}
                            <div className={styles.ownerSection}>
                                <h3><FiUser size={18} /> Owner Details</h3>
                                <div className={styles.ownerGrid}>
                                    <div className={styles.ownerCard}>
                                        <div className={styles.ownerAvatar}>
                                            {vahakDetails.vahakDetails.ownerName?.charAt(0) || 'O'}
                                        </div>
                                        <div className={styles.ownerMainInfo}>
                                            <h4>{vahakDetails.vahakDetails.ownerName}</h4>
                                            <span className={styles.ownershipType}>
                                                {vahakDetails.vahakDetails.ownershipType}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.contactInfo}>
                                        <div className={styles.contactItem}>
                                            <FiPhone size={16} />
                                            <span>{vahakDetails.vahakDetails.ownerPhone || '-'}</span>
                                        </div>
                                        <div className={styles.contactItem}>
                                            <FiMail size={16} />
                                            <span>{vahakDetails.vahakDetails.ownerEmail || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                {vahakDetails.vahakDetails.ownerAddress && (
                                    <div className={styles.addressCard}>
                                        <h4>Address</h4>
                                        <p>
                                            {vahakDetails.vahakDetails.ownerAddress.street || ''}<br />
                                            {vahakDetails.vahakDetails.ownerAddress.city || ''}, {vahakDetails.vahakDetails.ownerAddress.state || ''}
                                        </p>
                                    </div>
                                )}

                                {/* Sensitive Data (masked) */}
                                <div className={styles.sensitiveData}>
                                    <div className={styles.sensitiveItem}>
                                        <span>Aadhar</span>
                                        <code>{vahakDetails.vahakDetails.ownerAadhar || '-'}</code>
                                    </div>
                                    <div className={styles.sensitiveItem}>
                                        <span>PAN</span>
                                        <code>{vahakDetails.vahakDetails.ownerPAN || '-'}</code>
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain Info */}
                            <div className={styles.blockchainSection}>
                                <h3><FiShield size={18} /> Blockchain Verification</h3>
                                <div className={styles.blockchainGrid}>
                                    <div className={styles.blockchainItem}>
                                        <FiHash size={20} />
                                        <div>
                                            <span>Owner Hash</span>
                                            <code>{truncateHash(vahakDetails.vahakDetails.blockchainHash)}</code>
                                        </div>
                                    </div>
                                    <div className={styles.blockchainItem}>
                                        <FiLink size={20} />
                                        <div>
                                            <span>Vehicle Hash</span>
                                            <code>{truncateHash(vahakDetails.blockchainTracking?.vehicleHash)}</code>
                                        </div>
                                    </div>
                                    <div className={styles.blockchainItem}>
                                        <FiTruck size={20} />
                                        <div>
                                            <span>Total Trips</span>
                                            <strong>{vahakDetails.blockchainTracking?.totalTrips || 0}</strong>
                                        </div>
                                    </div>
                                    <div className={styles.blockchainItem}>
                                        <FiClock size={20} />
                                        <div>
                                            <span>Last Update</span>
                                            <strong>{formatDate(vahakDetails.blockchainTracking?.lastBlockUpdate)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {vahakDetails.vahakDetails.verifiedAt && (
                                    <div className={styles.verificationInfo}>
                                        <FiCheck className={styles.verifiedIcon} />
                                        <span>Verified on {formatDate(vahakDetails.vahakDetails.verifiedAt)}</span>
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
