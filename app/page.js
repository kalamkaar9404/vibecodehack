'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Heart,
  Stethoscope,
  Pill,
  Activity,
  Shield,
  Search,
  Utensils,
  Upload,
  Brain,
  FileText,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import styles from './page.module.css';

/* -------------------------------------------------- */
/*  Animated counter hook                              */
/* -------------------------------------------------- */
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime = null;
    let raf;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return count;
}

/* -------------------------------------------------- */
/*  Stats item with counter                            */
/* -------------------------------------------------- */
function StatItem({ target, suffix, label }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(target, 2200, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.statItem} ref={ref}>
      <div className={styles.statNumber}>
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Landing Page                                       */
/* -------------------------------------------------- */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
        }}
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <main>
      {/* ========== HERO ========== */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />

        {/* Floating medical icons */}
        <div className={styles.floatingIcons}>
          <div className={styles.floatingIcon}><Heart size={48} /></div>
          <div className={styles.floatingIcon}><Stethoscope size={56} /></div>
          <div className={styles.floatingIcon}><Pill size={40} /></div>
          <div className={styles.floatingIcon}><Activity size={52} /></div>
          <div className={styles.floatingIcon}><Brain size={44} /></div>
          <div className={styles.floatingIcon}><FileText size={38} /></div>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Sparkles size={16} />
            AI-Powered Medical Continuity
          </div>

          <h1 className={styles.heroTitle}>
            Your Complete Medical History.
            <br />
            One Intelligent Platform.
          </h1>

          <p className={styles.heroSubtitle}>
            AI-powered medical record management for pregnant women and chronic
            illness patients. Switch doctors without losing your story.
          </p>

          <div className={styles.heroCta}>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              See How It Works <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Why MedSync AI?</h2>
        <p className={styles.sectionSubtitle}>
          Three powerful pillars that redefine how you manage your health records
        </p>

        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <Shield size={28} />
            </div>
            <h3 className={styles.featureTitle}>Privacy-First Records</h3>
            <p className={styles.featureDesc}>
              Auto-anonymize your medical documents with AI-powered PII
              detection. Your data stays yours — always.
            </p>
          </div>

          {/* Card 2 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles.teal}`}>
              <Search size={28} />
            </div>
            <h3 className={styles.featureTitle}>Instant Doctor Briefing</h3>
            <p className={styles.featureDesc}>
              New doctor gets your full history in 2 minutes, with cited proof
              from original documents.
            </p>
          </div>

          {/* Card 3 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <Utensils size={28} />
            </div>
            <h3 className={styles.featureTitle}>Smart Diet Planning</h3>
            <p className={styles.featureDesc}>
              Indian-cuisine-aware ingredient substitutions matched to your
              health profile and dietary needs.
            </p>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>
          Three simple steps to never lose a medical record again
        </p>

        <div className={styles.stepsRow}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepConnector} />
            <div className={styles.stepIconWrap}>
              <Upload size={24} />
            </div>
            <h4 className={styles.stepTitle}>Upload</h4>
            <p className={styles.stepDesc}>
              Upload prescriptions, lab reports, scans — any medical document
              in any format.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepConnector} />
            <div className={styles.stepIconWrap}>
              <Brain size={24} />
            </div>
            <h4 className={styles.stepTitle}>AI Processes</h4>
            <p className={styles.stepDesc}>
              Our AI extracts, anonymizes, and organizes your records into a
              smart medical timeline.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepIconWrap}>
              <FileText size={24} />
            </div>
            <h4 className={styles.stepTitle}>Doctor Reads Summary</h4>
            <p className={styles.stepDesc}>
              Share a secure, cited briefing with any new doctor — instant
              continuity of care.
            </p>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className={styles.stats}>
        <div className={styles.statsCard}>
          <StatItem target={10000} suffix="+" label="Documents Processed" />
          <StatItem target={500} suffix="+" label="Doctors Connected" />
          <StatItem target={98} suffix="%" label="Accuracy Rate" />
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to own your medical story?</h2>
        <p className={styles.ctaDesc}>
          Join thousands of patients who never have to repeat their history again.
        </p>
        <Link href="/auth" className="btn btn-primary btn-lg" style={{ position: 'relative', zIndex: 1 }}>
          Create Free Account <ArrowRight size={18} />
        </Link>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandIcon}>
              <Activity size={18} color="#fff" />
            </div>
            <span className={styles.footerBrandName}>MedSync AI</span>
          </div>

          <span className={styles.footerCopy}>
            © 2026 MedSync AI. All rights reserved.
          </span>

          <div className={styles.footerLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
            <a href="#">About</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
