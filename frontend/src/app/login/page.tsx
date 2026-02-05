'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiTruck, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import ChromaKeyImage from '@/components/ChromaKeyImage';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.leftPanel}>
                <div className={styles.leftContent}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <FiTruck size={28} />
                        </div>
                        <span className={styles.logoText}>Cochin Logistics</span>
                    </div>
                    <div className={styles.characterContainer}>
                        <ChromaKeyImage src="/indian_delivery.png" alt="Delivery Partner" className={styles.character} />
                    </div>
                    <h2>India&apos;s Most Trusted Logistics Partner</h2>
                    <p>Real-time tracking, warehouse management, fleet control, and powerful analytics all in one platform.</p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h1>Welcome Back</h1>
                        <p>Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className={styles.errorAlert}>
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className={styles.inputWrapper}>
                                <FiMail className={styles.inputIcon} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className={styles.inputWrapper}>
                                <FiLock className={styles.inputIcon} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles.demoCredentials}>
                        <p>Demo Credentials:</p>
                        <div className={styles.credentialsList}>
                            <div className={styles.credential}>
                                <span className={styles.credentialRole}>Admin</span>
                                <span>admin@logistics.com / admin123</span>
                            </div>
                            <div className={styles.credential}>
                                <span className={styles.credentialRole}>Viewer</span>
                                <span>viewer@logistics.com / viewer123</span>
                            </div>
                            <div className={styles.credential}>
                                <span className={styles.credentialRole}>Customer</span>
                                <span>customer@client.com / customer123</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <Link href="/">← Back to Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
