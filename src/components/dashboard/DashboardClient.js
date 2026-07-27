'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [produtos, setProdutos] = useState([]);
  const [clientesNovos, setClientesNovos] = useState(0);
  const [contasMes, setContasMes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [ano, m] = mes.split('-').map(Number);
    const inicio = new Date(ano, m - 1, 1).toISOString();
    const fim = new Date(ano, m, 1).toISOString();

    const [{ data: v }, { data: p }, { count: novosClientes }, { data: contas }] = await Promise.all([
      supabase.from('vendas').select('*').gte('criado_em', inicio).lt('criado_em', fim).order('criado_em', { ascending: false }),
      supabase.from('produtos').select('*'),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).gte('criado_em', inicio).lt('criado_em', fim),
      supabase.from('contas_pagar').select('valor'),
    ]);
    setVendas(v || []);
    setProdutos(p || []);
    setClientesNovos(novosClientes || 0);
    setContasMes((contas || []).reduce((s, c) => s + c.valor, 0));
    setCarregando(false);
  }, [mes, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  const faturamento = vendas.reduce((s, v) => s + v.total, 0);
  const lucroEstimado = faturamento * 0.45;
  const ticketMedio = vendas.length ? faturamento / vendas.length : 0;
  const estoqueBaixo = produtos.filter((p) => p.estoque <= MIN_ESTOQUE).length;

  const [anoSel, mesSel] = mes.split('-').map(Number);
  const diasNoMes = new Date(anoSel, mesSel, 0).getDate();
  const vendasPorDia = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const total = vendas
      .filter((v) => new Date(v.criado_em).getDate() === dia)
      .reduce((s, v) => s + v.total, 0);
    return { dia, total };
  });
  const maiorValorDia = Math.max(...vendasPorDia.map((d) => d.total), 1);

  return (
    <div>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.sub}>Conectado como <b>{nomeUsuario}</b></p>
        </div>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...ui.input, width: 180 }} />
      </div>

      {carregando ? <div style={ui.emptyCell}>Carregando...</div> : (
        <>
          <div style={ui.kpiGrid}>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(faturamento)}</div><div style={ui.kpiLabel}>Faturamento do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(lucroEstimado)}</div><div style={ui.kpiLabel}>Lucro estimado do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{vendas.length}</div><div style={ui.kpiLabel}>Vendas no mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(ticketMedio)}</div><div style={ui.kpiLabel}>Ticket médio do mês</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{produtos.length}</div><div style={ui.kpiLabel}>Produtos cadastrados</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{estoqueBaixo}</div><div style={ui.kpiLabel}>Produtos com estoque baixo</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(contasMes)}</div><div style={ui.kpiLabel}>Contas a pagar</div></div>
            <div style={ui.kpiCard}><div style={ui.kpiValue}>{clientesNovos}</div><div style={ui.kpiLabel}>Novos clientes no mês</div></div>
          </div>

          <div style={{ ...ui.panel, marginBottom: 20 }}>
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
    </div>
  );
}