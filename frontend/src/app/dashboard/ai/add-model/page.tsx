'use client';

import Link from 'next/link';
import { FiArrowLeft, FiSettings } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

export default function AddModelPage() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 12000,
            background: '#0a0a0a',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            overflowY: 'auto'
        }}>
            {/* Fixed Back Button - Top Left with high z-index */}
            <Link href="/dashboard/ai" style={{
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                textDecoration: 'none',
                zIndex: 10001,
                transition: 'all 0.2s',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)'
            }}>
                <FiArrowLeft size={20} />
            </Link>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '1.5rem',
                maxWidth: '400px',
                width: '100%'
            }}>
                {/* Gear/Cog Animation */}
                <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '160px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        position: 'absolute',
                        animation: 'rotateGear 8s linear infinite'
                    }}>
                        <FiSettings size={100} style={{ color: 'rgba(139, 92, 246, 0.3)' }} />
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        animation: 'rotateGearReverse 5s linear infinite'
                    }}>
                        <FiSettings size={40} style={{ color: 'rgba(139, 92, 246, 0.5)' }} />
                    </div>
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        width: '70px',
                        height: '70px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        <HiOutlineSparkles size={32} color="#fff" />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '2rem',
                    padding: '0.5rem 1.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#a78bfa',
                    fontWeight: '600'
                }}>
                    ⚙️ Under Construction
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '1rem',
                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Add Model
                </h1>

                <p style={{
                    color: '#888',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                }}>
                    The gears are turning! AI model integration is being engineered.
                </p>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#666',
                    fontSize: '0.85rem'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        animation: 'blink 1s infinite'
                    }} />
                    Engineering in progress...
                </div>
            </div>

            <style jsx>{`
                @keyframes rotateGear {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes rotateGearReverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
