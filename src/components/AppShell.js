'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import ContasAlerta from './ui/ContasAlerta';

export default function AppShell({ title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF8F5' }}>
      <ContasAlerta />
      <div className={`mobile-overlay${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className={`main-content${collapsed ? ' expanded' : ''}`}>
        <div style={styles.topbar}>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div>
            <div style={styles.title}>{title}</div>
            {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
          </div>
        </div>
        <div className="content-pad" style={{ padding: 28 }}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  topbar: {
    height: 64, background: '#fff', borderBottom: '1px solid #E7E2D9', display: 'flex',
    alignItems: 'center', gap: 12, padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
  },
  title: { fontSize: 18, fontWeight: 800, letterSpacing: '-.01em', color: '#1B1A18' },
  subtitle: { fontSize: 11.5, color: '#726A5D', marginTop: 1 },
};
