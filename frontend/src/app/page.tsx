'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiTruck, FiPackage, FiMapPin, FiBarChart2, FiShield, FiUsers } from 'react-icons/fi';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <FiTruck size={24} />
            </div>
            <span className={styles.logoText}>Bharat Logistics</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/login" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>🚀 India&apos;s Premier Logistics Platform</span>
          </div>
          <h1 className={styles.heroTitle}>
            Streamline Your <span className={styles.gradient}>Logistics Operations</span>
          </h1>
          <p className={styles.heroSubtitle}>
            End-to-end logistics management platform featuring real-time tracking,
            warehouse optimization, fleet management, and powerful analytics.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Start Free Trial
            </Link>
            <Link href="#features" className="btn btn-outline btn-lg">
              Learn More
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.dashboardPreview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewDots}>
                <span></span><span></span><span></span>
              </div>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewStats}>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatValue}>2,547</span>
                  <span className={styles.previewStatLabel}>Active Shipments</span>
                </div>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatValue}>98.5%</span>
                  <span className={styles.previewStatLabel}>On-Time Rate</span>
                </div>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatValue}>₹9.5Cr</span>
                  <span className={styles.previewStatLabel}>Revenue</span>
                </div>
              </div>
              <div className={styles.previewChart}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Powerful Features for Modern Logistics</h2>
            <p>Everything you need to manage your logistics operations in one platform</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #0066ff 0%, #00d98f 100%)' }}>
                <FiMapPin size={24} />
              </div>
              <h3>Real-Time Tracking</h3>
              <p>Track shipments and fleet in real-time with GPS integration and live status updates.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
                <FiPackage size={24} />
              </div>
              <h3>Warehouse Management</h3>
              <p>Multi-location inventory control with barcode scanning and stock optimization.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}>
                <FiTruck size={24} />
              </div>
              <h3>Fleet Management</h3>
              <p>Manage vehicles, drivers, maintenance schedules, and fuel consumption tracking.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>
                <FiBarChart2 size={24} />
              </div>
              <h3>Analytics & Reports</h3>
              <p>Comprehensive KPI dashboards with OTIF rates, cost analysis, and MIS reports.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0066ff 100%)' }}>
                <FiShield size={24} />
              </div>
              <h3>Role-Based Access</h3>
              <p>Secure access control with customer, viewer, and admin roles.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #f97316 0%, #facc15 100%)' }}>
                <FiUsers size={24} />
              </div>
              <h3>Customer Portal</h3>
              <p>Self-service tracking portal with invoice visibility and notifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <div className={styles.logoIcon}>
                  <FiTruck size={20} />
                </div>
                <span className={styles.logoText}>Bharat Logistics</span>
              </div>
              <p>Enterprise logistics management platform for modern businesses.</p>
            </div>
            <div className={styles.footerLinks}>
              <div>
                <h4>Product</h4>
                <Link href="#">Features</Link>
                <Link href="#">Pricing</Link>
                <Link href="#">Integrations</Link>
              </div>
              <div>
                <h4>Company</h4>
                <Link href="#">About</Link>
                <Link href="#">Careers</Link>
                <Link href="#">Contact</Link>
              </div>
              <div>
                <h4>Resources</h4>
                <Link href="#">Documentation</Link>
                <Link href="#">API Reference</Link>
                <Link href="#">Support</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 Bharat Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
