'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const NAV_GROUPS = [
  {
    label: 'Operação',
    items: [
      { href: '/pdv', label: 'PDV / Vendas', icon: 'cart' },
      { href: '/estoque', label: 'Estoque', icon: 'box' },
      { href: '/faturamento', label: 'Faturamento do Dia', icon: 'coin' },
      { href: '/dashboard', label: 'Faturamento Mensal', icon: 'grid' },
    ],
  },
  {
    label: 'Relacionamento',
    items: [
      { href: '/clientes', label: 'Clientes', icon: 'user' },
      { href: '/fornecedores', label: 'Fornecedores', icon: 'truck' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/financeiro', label: 'Financeiro', icon: 'trend' },
      { href: '/contas', label: 'Contas a Pagar', icon: 'bill' },
      { href: '/relatorios', label: 'Relatórios', icon: 'report' },
    ],
  },
];

const ICONS = {
  grid: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />,
  box: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  cart: <path d="M3 9h18l-1.5 10.5a2 2 0 01-2 1.5H6.5a2 2 0 01-2-1.5L3 9zM8 9V6a4 4 0 018 0v3" />,
  coin: <path d="M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 7v10" />,
  user: <path d="M12 8m-4 0a4 4 0 108 0 4 4 0 10-8 0M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />,
  truck: <path d="M3 7h18v13H3zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  bill: <path d="M3 4h18v16H3zM3 10h18M8 15h4" />,
  report: <path d="M6 3h9l5 5v13H6zM9 12h6M9 16h6M9 8h2" />,
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div style={styles.head}>
        <div style={styles.logoBadge}>
          <Image src="/logo-master-joias.jpg" alt="Master Joias" width={44} height={44} style={{ objectFit: 'contain', display: 'block' }} />
        </div>
        {!collapsed && <div style={styles.full}>MASTER JOIAS</div>}
      </div>

      <nav style={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && <div style={styles.navLabel}>{group.label}</div>}
            {group.items.map((item) => {
              const active = pathname === item.href;
              const content = (
                <div style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                    {ICONS[item.icon]}
                  </svg>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                </div>
              );
              return (
                <Link key={item.href} href={item.href} onClick={onCloseMobile} style={{ textDecoration: 'none' }}>
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={styles.foot}>
        <button onClick={handleLogout} style={styles.logoutBtn}>{collapsed ? '⏻' : 'Sair'}</button>
        <button onClick={onToggle} style={styles.collapseBtn} title="Recolher menu">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  head: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '22px 20px',
    borderBottom: '1px solid rgba(255,255,255,.08)', whiteSpace: 'nowrap',
  },
  logoBadge: {
    width: 46, height: 46, borderRadius: 12, background: '#fff', border: '1px solid #B8935A',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 4,
    boxShadow: '0 0 0 3px rgba(184,147,90,.15)',
  },
  full: { fontSize: 12, letterSpacing: 2.5, fontWeight: 700, color: '#D9BD8C' },
  nav: { flex: 1, padding: '14px 12px', overflowY: 'auto' },
  navLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#726A5D',
    padding: '14px 10px 6px', fontWeight: 700,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 500, marginBottom: 2, color: '#D6CFC2', whiteSpace: 'nowrap',
  },
  navItemActive: {
    background: 'linear-gradient(90deg, rgba(184,147,90,.22), rgba(184,147,90,.04))',
    color: '#D9BD8C',
  },
  foot: { padding: 14, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8 },
  logoutBtn: {
    flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#D6CFC2',
    borderRadius: 9, padding: '9px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  collapseBtn: {
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#D6CFC2',
    borderRadius: 9, width: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
