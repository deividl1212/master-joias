'use client';

import { ui, brl } from '@/lib/uiStyles';

const FORMAS = ['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Promissória'];

export default function FaturamentoClient({ vendasIniciais, recebimentosIniciais, sangriasHoje }) {
  const vendas = vendasIniciais;
  const recebimentos = recebimentosIniciais;

  const faturamentoVendas = vendas.reduce((s, v) => s + (v.pagamento === 'Promissória' ? (v.valor_entrada || 0) : v.total), 0);
  const recebidoPromissorias = recebimentos.reduce((s, r) => s + r.valor, 0);
  const faturamentoTotal = faturamentoVendas + recebidoPromissorias;

  const numeroVendas = vendas.length;
  const ticketMedio = numeroVendas ? vendas.reduce((s, v) => s + v.total, 0) / numeroVendas : 0;

  const porForma = FORMAS.reduce((acc, f) => {
    acc[f] = vendas
      .filter((v) => v.pagamento === f)
      .reduce((s, v) => s + (f === 'Promissória' ? (v.valor_entrada || 0) : v.total), 0);
    return acc;
  }, {});

  return (
    <div>
      <div style={ui.kpiGrid}>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(faturamentoTotal)}</div><div style={ui.kpiLabel}>Faturamento do dia</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{numeroVendas}</div><div style={ui.kpiLabel}>Vendas no dia</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(ticketMedio)}</div><div style={ui.kpiLabel}>Ticket médio</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(sangriasHoje)}</div><div style={ui.kpiLabel}>Sangrias do dia</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(recebidoPromissorias)}</div><div style={ui.kpiLabel}>Recebido de promissórias hoje</div></div>
      </div>

      <div style={{ ...ui.panel, marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Vendas por forma de pagamento</div>
        <div className="kpi-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#E7E2D9' }}>
          {FORMAS.map((f) => (
            <div key={f} style={{ background: '#fff', padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{brl(porForma[f])}</div>
              <div style={{ fontSize: 11.5, color: '#726A5D', marginTop: 4 }}>{f}{f === 'Promissória' ? ' (entrada)' : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {recebimentos.length > 0 && (
        <div style={ui.panel}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Recebimentos de promissórias hoje</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={ui.table}>
              <thead><tr>{['Hora', 'Cliente', 'Valor'].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
              <tbody>
                {recebimentos.map((r) => (
                  <tr key={r.id}>
                    <td style={ui.td}>{new Date(r.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...ui.td, fontWeight: 600 }}>{r.promissorias?.cliente_nome || '—'}</td>
                    <td style={ui.td}>{brl(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}