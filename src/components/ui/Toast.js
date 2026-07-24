'use client';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={styles.wrap}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...styles.toast, ...(t.type === 'error' ? styles.error : {}) }}>
          {t.type === 'error' ? '⚠' : '✓'} {t.message}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', top: 20, right: 20, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 },
  toast: {
    background: '#1B1A18', color: '#fff', padding: '13px 16px', borderRadius: 12,
    boxShadow: '0 12px 32px rgba(27,26,24,.2)', fontSize: 13, fontFamily: 'Inter, sans-serif',
    borderLeft: '3px solid #B8935A',
  },
  error: { background: '#A85252', borderLeft: 'none' },
};
