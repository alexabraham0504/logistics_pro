'use client';

import Link from 'next/link';
import { FiArrowLeft, FiBox } from 'react-icons/fi';
import { HiOutlineTemplate } from 'react-icons/hi';
import styles from '../ai.module.css';

export default function BrowseTemplatesPage() {
    return (
        <div className={styles.pageWrapper} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
            {/* Fixed Back Button - Top Left */}
            <Link href="/dashboard/ai" style={{
                position: 'fixed',
                top: '0.75rem',
                left: '0.75rem',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                textDecoration: 'none',
                zIndex: 100,
                transition: 'all 0.2s',
                border: '1px solid rgba(255,255,255,0.1)'
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
                {/* Card Stack Animation - Templates shuffling */}
                <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '140px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Stacked cards */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            width: '80px',
                            height: '100px',
                            background: `linear-gradient(135deg, rgba(236, 72, 153, ${0.2 + i * 0.2}), rgba(219, 39, 119, ${0.1 + i * 0.15}))`,
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: `cardShuffle 3s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                            transform: `translateX(${(3 - i) * 8}px) translateY(${(3 - i) * 5}px)`,
                            zIndex: i
                        }}>
                            <HiOutlineTemplate size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        </div>
                    ))}

                    {/* Front card with icon */}
                    <div style={{
                        position: 'absolute',
                        width: '80px',
                        height: '100px',
                        background: 'linear-gradient(135deg, #ec4899, #db2777)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 40px rgba(236, 72, 153, 0.4)',
                        animation: 'cardPop 3s ease-in-out infinite',
                        zIndex: 10
                    }}>
                        <HiOutlineTemplate size={32} color="#fff" />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    borderRadius: '2rem',
                    padding: '0.5rem 1.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#f472b6',
                    fontWeight: '600'
                }}>
                    📚 Under Construction
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '1rem',
                    background: 'linear-gradient(90deg, #ec4899, #f472b6)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Browse Templates
                </h1>

                <p style={{
                    color: '#888',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                }}>
                    Stacking up amazing templates! The library is being curated.
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
                        background: '#ec4899',
                        animation: 'blink 1s infinite'
                    }} />
                    Curating templates...
                </div>
            </div>

            <style jsx>{`
                @keyframes cardShuffle {
                    0%, 100% { transform: translateX(var(--x, 0)) translateY(var(--y, 0)) rotate(0deg); }
                    50% { transform: translateX(var(--x, 0)) translateY(calc(var(--y, 0) - 10px)) rotate(2deg); }
                }
                @keyframes cardPop {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.05) rotate(-3deg); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
