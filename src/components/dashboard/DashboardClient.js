'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ui, brl } from '@/lib/uiStyles';

const MIN_ESTOQUE = 2;

function mesAtualStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardClient({ nomeUsuario }) {
  const supabase = createClient();
  const [mes, setMes] = useState(mesAtualStr());
  const [vendas, setVendas] = useState([]);
  const [recebimentosPromissorias, setRecebimentosPromissorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientesNovos, setClientesNovos] = useState(0);
  const [contasMes, setContasMes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const printAreaRef = useRef(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [ano, m] = mes.split('-').map(Number);
    const inicio = new Date(ano, m - 1, 1).toISOString();
    const fim = new Date(ano, m, 1).toISOString();

    const [{ data: v }, { data: rp }, { data: p }, { count: novosClientes }, { data: contas }] = await Promise.all([
      supabase.from('vendas').select('*, venda_itens(*)').gte('criado_em', inicio).lt('criado_em', fim).order('criado_em', { ascending: false }),
      supabase.from('promissoria_recebimentos').select('*').gte('criado_em', inicio).lt('criado_em', fim),
      supabase.from('produtos').select('*'),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).gte('criado_em', inicio).lt('criado_em', fim),
      supabase.from('contas_pagar').select('valor'),
    ]);
    setVendas(v || []);
    setRecebimentosPromissorias(rp || []);
    setProdutos(p || []);
    setClientesNovos(novosClientes || 0);
    setContasMes((contas || []).reduce((s, c) => s + c.valor, 0));
    setCarregando(false);
  }, [mes, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  const faturamentoVendas = vendas.reduce((s, v) => s + (v.pagamento === 'Promissória' ? (v.valor_entrada || 0) : v.total), 0);
  const recebidoPromissorias = recebimentosPromissorias.reduce((s, r) => s + r.valor, 0);
  const faturamento = faturamentoVendas + recebidoPromissorias;

  const lucroEstimado = faturamento * 0.45;
  const ticketMedio = vendas.length ? vendas.reduce((s, v) => s + v.total, 0) / vendas.length : 0;
  const estoqueBaixo = produtos.filter((p) => p.estoque <= MIN_ESTOQUE).length;

  const [anoSel, mesSel] = mes.split('-').map(Number);
  const diasNoMes = new Date(anoSel, mesSel, 0).getDate();
  const vendasPorDia = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const totalVendasDia = vendas
      .filter((v) => new Date(v.criado_em).getDate() === dia)
      .reduce((s, v) => s + (v.pagamento === 'Promissória' ? (v.valor_entrada || 0) : v.total), 0);
    const totalRecebidoDia = recebimentosPromissorias
      .filter((r) => new Date(r.criado_em).getDate() === dia)
      .reduce((s, r) => s + r.valor, 0);
    return { dia, total: totalVendasDia + totalRecebidoDia };
  });
  const maiorValorDia = Math.max(...vendasPorDia.map((d) => d.total), 1);

  const contagemProdutos = {};
  vendas.forEach((v) => {
    (v.venda_itens || []).forEach((item) => {
      contagemProdutos[item.nome_produto] = (contagemProdutos[item.nome_produto] || 0) + item.quantidade;
    });
  });
  const topProdutos = Object.entries(contagemProdutos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maiorQtdProduto = topProdutos.length ? topProdutos[0][1] : 1;

  function nomeMesExtenso() {
    return new Date(anoSel, mesSel - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function imprimirRelatorio() {
    const linhasVendas = vendas.map((v) =>
      `<tr><td style="padding:6px;border-bottom:1px solid #eee;">${new Date(v.criado_em).toLocaleDateString('pt-BR')}</td><td style="padding:6px;border-bottom:1px solid #eee;">${v.cliente_nome}</td><td style="padding:6px;border-bottom:1px solid #eee;">${v.pagamento}</td><td style="padding:6px;border-bottom:1px solid #eee;">${brl(v.total)}</td></tr>`
    ).join('');
    const linhasTop = topProdutos.map(([nome, qtd], idx) =>
      `<tr><td style="padding:6px;border-bottom:1px solid #eee;">${idx + 1}º</td><td style="padding:6px;border-bottom:1px solid #eee;">${nome}</td><td style="padding:6px;border-bottom:1px solid #eee;">${qtd}</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:Inter,sans-serif; padding:24px;">
        <div style="display:flex; align-items:center; justify-content:center; flex-direction:column; margin-bottom:18px; text-align:center;">
          <img src="/logo-master-joias.png" alt="Master Joias" style="height:80px; object-fit:contain; margin-bottom:8px;" />
          <h2 style="margin:0;">Faturamento Mensal</h2>
          <div style="font-size:13px; color:#726A5D; text-transform:capitalize;">${nomeMesExtenso()}</div>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px;">
          <tbody>
            <tr><td style="padding:6px; font-weight:600;">Faturamento do mês</td><td style="padding:6px;">${brl(faturamento)}</td></tr>
            <tr><td style="padding:6px; font-weight:600;">Recebido de promissórias</td><td style="padding:6px;">${brl(recebidoPromissorias)}</td></tr>
            <tr><td style="padding:6px; font-weight:600;">Lucro estimado</td><td style="padding:6px;">${brl(lucroEstimado)}</td></tr>
            <tr><td style="padding:6px; font-weight:600;">Número de vendas</td><td style="padding:6px;">${vendas.length}</td></tr>
            <tr><td style="padding:6px; font-weight:600;">Ticket médio</td><td style="padding:6px;">${brl(ticketMedio)}</td></tr>
          </tbody>
        </table>

        <h3 style="margin-bottom:8px;">Top produtos mais vendidos</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px;">
          <thead><tr><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Posição</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Produto</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Vendas</th></tr></thead>
          <tbody>${linhasTop || '<tr><td colspan="3" style="padding:6px;">Nenhuma venda nesse mês.</td></tr>'}</tbody>
        </table>

        <h3 style="margin-bottom:8px;">Vendas do mês</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead><tr><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Cliente</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Pagamento</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Total</th></tr></thead>
          <tbody>${linhasVendas || '<tr><td colspan="4" style="padding:6px;">Nenhuma venda nesse mês.</td></tr>'}</tbody>
        </table>
      </div>
    `;
    if (printAreaRef.current) {
      printAreaRef.current.innerHTML = html;
    }
    window.print();
  }

  return (
    <div>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.sub}>Conectado como <b>{nomeUsuario}</b></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...ui.input, width: 180 }} />
          <button onClick={imprimirRelatorio} style={ui.btnOutline}>Imprimir relatório</button>
        </div>
      </div>

      {carregando ? <div style={ui.emptyCell}>Carregando...</div> : (
        <>
          <div style={ui.kpiGrid}>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(faturamento)}</div><div style={ui.kpiLabel}>Faturamento do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(lucroEstimado)}</div><div style={ui.kpiLabel}>Lucro estimado do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{vendas.length}</div><div style={ui.kpiLabel}>Vendas no mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(ticketMedio)}</div><div style={ui.kpiLabel}>Ticket médio do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(recebidoPromissorias)}</div><div style={ui.kpiLabel}>Recebido de promissórias no mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{produtos.length}</div><div style={ui.kpiLabel}>Produtos cadastrados</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{estoqueBaixo}</div><div style={ui.kpiLabel}>Produtos com estoque baixo</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(contasMes)}</div><div style={ui.kpiLabel}>Contas a pagar</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{clientesNovos}</div><div style={ui.kpiLabel}>Novos clientes no mês</div></div>
          </div>

          <div className="grid-2-responsive" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 20, alignItems: 'stretch' }}>
            <div style={ui.panel}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Vendas por dia do mês</div>
              <div style={{ padding: '20px 18px 14px', overflowX: 'auto' }}>
                {faturamento === 0 ? (
                  <div style={ui.emptyCell}>Nenhuma venda registrada nesse mês ainda.</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, minWidth: diasNoMes * 22 }}>
                    {vendasPorDia.map(({ dia, total }) => (
                      <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 18 }}>
                        <div
                          title={`Dia ${dia}: ${brl(total)}`}
                          style={{
                            width: '100%',
                            maxWidth: 16,
                            height: total > 0 ? Math.max((total / maiorValorDia) * 130, 4) : 2,
                            background: total > 0 ? 'linear-gradient(180deg, #B8935A, #8F6E3E)' : '#F1EEE8',
                            borderRadius: '4px 4px 0 0',
                          }}
                        />
                        <div style={{ fontSize: 9.5, color: '#9C9184', marginTop: 6 }}>{dia}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={ui.panel}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Top 3 produtos mais vendidos</div>
              <div style={{ padding: '18px' }}>
                {topProdutos.length === 0 ? (
                  <div style={ui.emptyCell}>Nenhuma venda registrada nesse mês ainda.</div>
                ) : topProdutos.map(([nome, qtd], idx) => (
                  <div key={nome} style={{ marginBottom: idx < topProdutos.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600 }}>{idx + 1}º {nome}</span>
                      <span style={{ color: '#726A5D' }}>{qtd} {qtd === 1 ? 'venda' : 'vendas'}</span>
                    </div>
                    <div style={{ height: 8, background: '#F1EEE8', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(qtd / maiorQtdProduto) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #8F6E3E, #B8935A)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={ui.panel}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Vendas do mês</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={ui.table}>
                <thead><tr>{['Data', 'Cliente', 'Pagamento', 'Total'].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {vendas.length === 0 ? (
                    <tr><td colSpan={4} style={ui.emptyCell}>Nenhuma venda nesse mês.</td></tr>
                  ) : vendas.slice(0, 8).map((v) => (
                    <tr key={v.id}>
                      <td style={ui.td}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...ui.td, fontWeight: 600 }}>{v.cliente_nome}</td>
                      <td style={ui.td}>{v.pagamento}</td>
                      <td style={ui.td}>{brl(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div id="print-area" ref={printAreaRef}></div>
    </div>
  );
}