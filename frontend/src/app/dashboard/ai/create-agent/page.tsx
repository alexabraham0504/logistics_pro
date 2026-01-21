'use client';

import Link from 'next/link';
import { FiArrowLeft, FiTool } from 'react-icons/fi';

export default function CreateAgentPage() {
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
                {/* Construction Animation - Crane building */}
                <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '160px',
                    marginBottom: '2rem'
                }}>
                    {/* Building blocks animating */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{
                                width: `${60 - i * 8}px`,
                                height: '20px',
                                background: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`,
                                borderRadius: '4px',
                                opacity: 0,
                                animation: `buildUp 2s ease-out infinite`,
                                animationDelay: `${i * 0.3}s`,
                                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
                            }} />
                        ))}
                    </div>

                    {/* Crane arm */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '20px',
                        width: '4px',
                        height: '80px',
                        background: '#666',
                        transformOrigin: 'bottom center',
                        animation: 'craneSwing 3s ease-in-out infinite'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '-20px',
                            width: '44px',
                            height: '4px',
                            background: '#f97316'
                        }} />
                        <FiTool style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-30px',
                            color: '#f97316',
                            animation: 'toolSwing 1s ease-in-out infinite'
                        }} size={20} />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '2rem',
                    padding: '0.5rem 1.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#f97316',
                    fontWeight: '600'
                }}>
                    🚧 Under Construction
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '1rem',
                    background: 'linear-gradient(90deg, #f97316, #fb923c)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Create New Agent
                </h1>

                <p style={{
                    color: '#888',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                }}>
                    We're building something amazing! Custom AI agent configuration is coming soon.
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
                        background: '#f97316',
                        animation: 'blink 1s infinite'
                    }} />
                    Building in progress...
                </div>
            </div>

            <style jsx>{`
                @keyframes buildUp {
                    0% { opacity: 0; transform: translateY(-30px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; }
                    100% { opacity: 0.3; }
                }
                @keyframes craneSwing {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                }
                @keyframes toolSwing {
                    0%, 100% { transform: rotate(-10deg); }
                    50% { transform: rotate(10deg); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
