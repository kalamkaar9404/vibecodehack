'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Stethoscope,
  Activity,
  Pill,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

/* -------------------------------------------------- */
/*  Inline styles (no external CSS module needed)      */
/* -------------------------------------------------- */
const pageStyles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  /* -- left panel -- */
  left: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, rgba(108,92,231,0.15) 0%, rgba(0,206,201,0.1) 100%)',
  },
  leftBg: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 70% 60% at 30% 40%, rgba(108,92,231,0.2), transparent 70%), radial-gradient(ellipse 50% 50% at 70% 70%, rgba(0,206,201,0.15), transparent 60%)',
    zIndex: 0,
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '48px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoDot: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#e8e8f0',
  },
  tagline: {
    fontSize: '1.15rem',
    color: '#8888a0',
    maxWidth: 340,
    margin: '0 auto',
    lineHeight: 1.7,
  },
  /* floating icons */
  floatingIcon: {
    position: 'absolute',
    opacity: 0.06,
    color: '#6c5ce7',
    pointerEvents: 'none',
  },
  /* -- right panel -- */
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 32px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '40px 36px',
    animation: 'fadeInUp 0.6s ease forwards',
  },
  header: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSub: {
    color: '#8888a0',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: 28,
  },
  /* tabs */
  tabs: {
    display: 'flex',
    gap: 4,
    background: '#12121a',
    borderRadius: 12,
    padding: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 28,
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px 0',
    border: 'none',
    background: active ? '#6c5ce7' : 'transparent',
    color: active ? '#fff' : '#8888a0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 500,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }),
  /* form */
  formGroup: { marginBottom: 20 },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#8888a0',
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#55556a',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    background: '#12121a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#e8e8f0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#55556a',
    cursor: 'pointer',
    display: 'flex',
    padding: 0,
  },
  forgot: {
    display: 'block',
    textAlign: 'right',
    fontSize: '0.82rem',
    color: '#6c5ce7',
    marginBottom: 24,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  submitBtn: (loading) => ({
    width: '100%',
    padding: '14px 0',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: loading ? 0.75 : 1,
    boxShadow: '0 0 20px rgba(108,92,231,0.3)',
  }),
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0',
    color: '#55556a',
    fontSize: '0.82rem',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  googleBtn: {
    width: '100%',
    padding: '12px 0',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    background: '#fff',
    color: '#333',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'all 0.3s ease',
  },
};

/* -------------------------------------------------- */
/*  Google "G" SVG                                     */
/* -------------------------------------------------- */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 000 24c0 3.77.9 7.34 2.56 10.5l7.97-5.91z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.91C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* -------------------------------------------------- */
/*  Auth Page Component                                */
/* -------------------------------------------------- */
export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // signup
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (activeTab === 'login') {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }, 2000);
  };

  return (
    <div style={pageStyles.wrapper}>
      {/* ---- LEFT PANEL ---- */}
      <div style={pageStyles.left}>
        <div style={pageStyles.leftBg} />

        {/* floating icons */}
        <div style={{ ...pageStyles.floatingIcon, top: '12%', left: '10%' }}>
          <Heart size={52} />
        </div>
        <div
          style={{
            ...pageStyles.floatingIcon,
            top: '25%',
            right: '12%',
            color: '#00cec9',
            animationDelay: '1s',
          }}
        >
          <Stethoscope size={60} />
        </div>
        <div
          style={{
            ...pageStyles.floatingIcon,
            bottom: '20%',
            left: '18%',
            color: '#00cec9',
          }}
        >
          <Pill size={44} />
        </div>
        <div
          style={{ ...pageStyles.floatingIcon, bottom: '12%', right: '15%' }}
        >
          <Activity size={48} />
        </div>

        <div style={pageStyles.leftContent}>
          <div style={pageStyles.logoRow}>
            <div style={pageStyles.logoDot}>
              <Activity size={24} color="#fff" />
            </div>
            <span style={pageStyles.logoText}>MedSync AI</span>
          </div>
          <p style={pageStyles.tagline}>
            Your complete medical history, beautifully organized and always
            accessible — powered by AI.
          </p>
        </div>
      </div>

      {/* ---- RIGHT PANEL ---- */}
      <div style={pageStyles.right}>
        <div style={pageStyles.card}>
          <h2 style={pageStyles.header}>Welcome to MedSync AI</h2>
          <p style={pageStyles.headerSub}>
            {activeTab === 'login'
              ? 'Sign in to access your medical records'
              : 'Create an account to get started'}
          </p>

          {/* tabs */}
          <div style={pageStyles.tabs}>
            <button
              style={pageStyles.tab(activeTab === 'login')}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              style={pageStyles.tab(activeTab === 'signup')}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Full Name</label>
                <div style={pageStyles.inputWrap}>
                  <span style={pageStyles.inputIcon}>
                    <User size={18} />
                  </span>
                  <input
                    style={pageStyles.input}
                    type="text"
                    placeholder="Dr. Priya Sharma"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Email Address</label>
              <div style={pageStyles.inputWrap}>
                <span style={pageStyles.inputIcon}>
                  <Mail size={18} />
                </span>
                <input
                  style={pageStyles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={activeTab === 'login' ? loginEmail : signupEmail}
                  onChange={(e) =>
                    activeTab === 'login'
                      ? setLoginEmail(e.target.value)
                      : setSignupEmail(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Password</label>
              <div style={pageStyles.inputWrap}>
                <span style={pageStyles.inputIcon}>
                  <Lock size={18} />
                </span>
                <input
                  style={pageStyles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={activeTab === 'login' ? loginPassword : signupPassword}
                  onChange={(e) =>
                    activeTab === 'login'
                      ? setLoginPassword(e.target.value)
                      : setSignupPassword(e.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  style={pageStyles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {activeTab === 'signup' && (
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Confirm Password</label>
                <div style={pageStyles.inputWrap}>
                  <span style={pageStyles.inputIcon}>
                    <Lock size={18} />
                  </span>
                  <input
                    style={pageStyles.input}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={pageStyles.eyeBtn}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'login' && (
              <a href="#" style={pageStyles.forgot}>
                Forgot Password?
              </a>
            )}

            <button type="submit" style={pageStyles.submitBtn(isLoading)}>
              {isLoading ? (
                <>
                  <div className="spinner spinner-sm" />
                  {activeTab === 'login'
                    ? 'Signing in…'
                    : 'Creating account…'}
                </>
              ) : (
                <>
                  {activeTab === 'login' ? 'Login' : 'Sign Up'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* divider */}
          <div style={pageStyles.divider}>
            <span style={pageStyles.dividerLine} />
            Or continue with
            <span style={pageStyles.dividerLine} />
          </div>

          {/* Google */}
          <button style={pageStyles.googleBtn}>
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
