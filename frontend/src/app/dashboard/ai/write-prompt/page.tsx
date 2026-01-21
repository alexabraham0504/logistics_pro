'use client';

import Link from 'next/link';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import styles from '../ai.module.css';

export default function WritePromptPage() {
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
                {/* Typewriter Animation */}
                <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '140px',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Paper with lines being written */}
                    <div style={{
                        width: '120px',
                        height: '100px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        overflow: 'hidden'
                    }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{
                                height: '8px',
                                background: 'linear-gradient(90deg, #10b981, transparent)',
                                borderRadius: '4px',
                                width: '0%',
                                animation: `writeLine 2s ease-out infinite`,
                                animationDelay: `${i * 0.4}s`
                            }} />
                        ))}
                    </div>

                    {/* Floating pencil */}
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '5px',
                        animation: 'pencilWrite 2s ease-in-out infinite',
                        color: '#10b981'
                    }}>
                        <FiEdit3 size={28} />
                    </div>
                </div>

                <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '2rem',
                    padding: '0.5rem 1.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#34d399',
                    fontWeight: '600'
                }}>
                    ✏️ Under Construction
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '1rem',
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Write Prompt
                </h1>

                <p style={{
                    color: '#888',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                }}>
                    Crafting the perfect prompt editor. Your words will shape AI!
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
                        background: '#10b981',
                        animation: 'blink 1s infinite'
                    }} />
                    Drafting in progress...
                </div>
            </div>

            <style jsx>{`
                @keyframes writeLine {
                    0% { width: 0%; }
                    50% { width: 100%; }
                    100% { width: 100%; opacity: 0.5; }
                }
                @keyframes pencilWrite {
                    0%, 100% { transform: translateX(0) translateY(0) rotate(-30deg); }
                    25% { transform: translateX(-10px) translateY(15px) rotate(-35deg); }
                    50% { transform: translateX(-20px) translateY(30px) rotate(-25deg); }
                    75% { transform: translateX(-10px) translateY(45px) rotate(-35deg); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
