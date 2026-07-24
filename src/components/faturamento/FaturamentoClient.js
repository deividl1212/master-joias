'use client';

import { ui, brl } from '@/lib/uiStyles';

const FORMAS = ['Pix', 'Dinheiro', 'Débito', 'Crédito'];

export default function FaturamentoClient({ vendasHoje, sangriasHoje }) {
  const total = vendasHoje.reduce((s, v) => s + v.total, 0);
  const ticketMedio = vendasHoje.length ? total / vendasHoje.length : 0;
  const totalSangrias = sangriasHoje.reduce((s, x) => s + x.valor, 0);
  const porForma = Object.fromEntries(FORMAS.map((f) => [f, vendasHoje.filter((v) => v.pagamento === f).reduce((s, v) => s + v.total, 0)]));

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <p style={{ ...ui.sub, marginBottom: 18, textTransform: 'capitalize' }}>{hoje}</p>

      <div style={ui.kpiGrid}>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(total)}</div><div style={ui.kpiLabel}>Faturamento total do dia</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{vendasHoje.length}</div><div style={ui.kpiLabel}>Número de vendas</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(ticketMedio)}</div><div style={ui.kpiLabel}>Ticket médio do dia</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(totalSangrias)}</div><div style={ui.kpiLabel}>Sangrias do dia</div></div>
      </div>

      <div className="kpi-grid-responsive" style={{ ...ui.kpiGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {FORMAS.map((f) => (
          <div key={f} style={{ ...ui.kpiCard, background: '#FAF8F5' }}>
            <div style={{ ...ui.kpiValue, fontSize: 18 }}>{brl(porForma[f])}</div>
            <div style={ui.kpiLabel}>{f}</div>
          </div>
        ))}
      </div>

      <div style={ui.panel}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Movimentações de hoje</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={ui.table}>
            <thead><tr>{['Hora', 'Cliente', 'Pagamento', 'Total'].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
            <tbody>
              {vendasHoje.length === 0 ? (
                <tr><td colSpan={4} style={ui.emptyCell}>Nenhuma movimentação hoje.</td></tr>
              ) : vendasHoje.map((v) => (
                <tr key={v.id}>
                  <td style={ui.td}>{new Date(v.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{v.cliente_nome}</td>
                  <td style={ui.td}>{v.pagamento}</td>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{brl(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
