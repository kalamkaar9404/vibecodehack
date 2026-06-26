'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Stethoscope,
  Utensils,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Globe,
  ChevronDown,
} from 'lucide-react';
import styles from './dashboard.module.css';

/* -------------------------------------------------- */
/*  Navigation model                                   */
/*  `ready: false` items render as non-linking chips   */
/*  with a "Soon" tag so the sidebar looks complete    */
/*  without creating 404 dead-ends. Flip to `true` and */
/*  the item becomes a real <Link> automatically.      */
/* -------------------------------------------------- */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, ready: false },
  { label: 'Upload', href: '/dashboard/upload', icon: Upload, ready: false },
  { label: 'Records', href: '/dashboard/records', icon: FileText, ready: false },
  { label: 'Doctor Query', href: '/dashboard/doctor', icon: Stethoscope, ready: false },
  { label: 'Diet Planner', href: '/dashboard/diet', icon: Utensils, ready: true },
];

const LANGUAGES = ['English', 'हिन्दी', 'বাংলা', 'தமிழ்', 'తెలుగు'];

/* -------------------------------------------------- */
/*  Sidebar                                            */
/* -------------------------------------------------- */
function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>
          <Activity size={22} />
        </div>
        <span className={styles.logoText}>MedSync AI</span>
      </div>

      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map(({ label, href, icon: Icon, ready }) => {
          const active = pathname === href;

          if (!ready) {
            return (
              <button
                key={href}
                className={styles.navItem}
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
                disabled
                title={`${label} — coming soon`}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span className={styles.navItemLabel}>{label}</span>
                {!collapsed && (
                  <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>
                    Soon
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span className={styles.navItemLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.collapseBtn} onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>PS</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Priya Sharma</div>
            <div className={styles.userRole}>Patient · 28 wks</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------- */
/*  Navbar                                             */
/* -------------------------------------------------- */
function Navbar({ collapsed }) {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('English');

  return (
    <header className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.navbarSearch}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search records, medications, reports…"
        />
      </div>

      <div className={styles.navbarActions}>
        <button className={styles.navbarBtn} title="Notifications">
          <Bell size={18} />
          <span className={styles.notifBadge}>3</span>
        </button>

        <div className={styles.langDropdown}>
          <button
            className={styles.navbarBtn}
            style={{ width: 'auto', padding: '0 12px', gap: 6 }}
            onClick={() => setLangOpen((o) => !o)}
            onBlur={() => setTimeout(() => setLangOpen(false), 150)}
            title="Language"
          >
            <Globe size={18} />
            <ChevronDown size={14} />
          </button>
          {langOpen && (
            <div className={styles.langMenu}>
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  className={`${styles.langOption} ${l === lang ? styles.active : ''}`}
                  onMouseDown={() => setLang(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.navbarAvatar}>PS</div>
      </div>
    </header>
  );
}

/* -------------------------------------------------- */
/*  Dashboard Layout                                   */
/* -------------------------------------------------- */
export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Navbar collapsed={collapsed} />
      <main className={`dashboard-main ${collapsed ? 'collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}
