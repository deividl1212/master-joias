// Estilos inline compartilhados entre todas as telas do sistema,
// pra manter a identidade visual (dourado/preto/branco/cinza) consistente
// sem repetir os mesmos objetos em cada componente.

export const ui = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 },
  toolbarActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  h1: { fontSize: 22, fontWeight: 800, margin: 0, color: '#1B1A18' },
  sub: { fontSize: 12.5, color: '#726A5D', margin: '4px 0 0' },
  erroBox: { background: '#F7EBEB', color: '#A85252', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  filtros: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  panel: { background: '#fff', border: '1px solid #E7E2D9', borderRadius: 14, overflow: 'hidden' },
  panelPad: { background: '#fff', border: '1px solid #E7E2D9', borderRadius: 14, padding: 20 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '11px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#726A5D', borderBottom: '1px solid #E7E2D9', fontWeight: 700, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', borderBottom: '1px solid #F1EEE8', whiteSpace: 'nowrap' },
  emptyCell: { padding: 40, textAlign: 'center', color: '#726A5D', fontSize: 13 },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid #E7E2D9', background: '#fff', cursor: 'pointer', fontSize: 12 },
  btnGold: { background: 'linear-gradient(135deg, #B8935A, #8F6E3E)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnOutline: { background: '#fff', border: '1px solid #D6CFC2', color: '#1B1A18', borderRadius: 10, padding: '11px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnGhost: { background: 'transparent', border: 'none', color: '#4B453C', padding: '11px 16px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnDanger: { background: '#A85252', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  input: { padding: '10px 13px', borderRadius: 9, border: '1px solid #D6CFC2', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' },
  field: { marginBottom: 14 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B453C', marginBottom: 6 },
  hint: { fontSize: 11, color: '#9C9184', marginTop: 4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(27,26,24,.55)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 12px 32px rgba(0,0,0,.2)' },
  modalNarrow: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 12px 32px rgba(0,0,0,.2)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #E7E2D9', fontSize: 15, fontWeight: 700 },
  modalBody: { padding: '20px 22px', fontSize: 13.5, color: '#4B453C' },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid #E7E2D9', background: '#FAF8F5' },
  closeBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid #E7E2D9', background: '#fff', cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 22 },
  kpiCard: { background: '#fff', border: '1px solid #E7E2D9', borderRadius: 14, padding: '18px 20px' },
  kpiValue: { fontSize: 24, fontWeight: 800, color: '#1B1A18' },
  kpiLabel: { fontSize: 12, color: '#726A5D', marginTop: 6 },
};

export function brl(v) {
  return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export const badgeColor = {
  green: { color: '#5B7B5A', background: '#EEF3ED' },
  red: { color: '#A85252', background: '#F7EBEB' },
  gold: { color: '#8F6E3E', background: '#F4EAD9' },
  gray: { color: '#4B453C', background: '#F1EEE8' },
};
