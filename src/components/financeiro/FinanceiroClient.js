'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ui, brl } from '@/lib/uiStyles';

const FORMAS = ['Pix', 'Dinheiro', 'Débito', 'Crédito'];

function mesAtualStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinanceiroClient() {
  const supabase = createClient();
  const [mes, setMes] = useState(mesAtualStr());
  const [vendas, setVendas] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [ano, m] = mes.split('-').map(Number);
    const inicio = new Date(ano, m - 1, 1).toISOString();
    const fim = new Date(ano, m, 1).toISOString();

    const [{ data: v }, { data: c }] = await Promise.all([
      supabase.from('vendas').select('*').gte('criado_em', inicio).lt('criado_em', fim),
      supabase.from('contas_pagar').select('*'),
    ]);
    setVendas(v || []);
    setContas(c || []);
    setCarregando(false);
  }, [mes, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  const receita = vendas.reduce((s, v) => s + v.total, 0);
  const custos = contas.reduce((s, c) => s + c.valor, 0);
  const despesas = contas.filter((c) => c.categoria !== 'Compra de mercadoria').reduce((s, c) => s + c.valor, 0);
  const lucro = receita - custos;
  const ticketMedio = vendas.length ? receita / vendas.length : 0;
  const pagas = contas.filter((c) => c.status === 'Pago').length;
  const pendVenc = contas.filter((c) => c.status !== 'Pago').length;
  const porForma = Object.fromEntries(FORMAS.map((f) => [f, vendas.filter((v) => v.pagamento === f).reduce((s, v) => s + v.total, 0)]));
  const totalPag = Object.values(porForma).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div style={ui.toolbar}>
        <div>
          <h1 style={ui.h1}>Financeiro</h1>
          <p style={ui.sub}>Resumo financeiro por mês</p>
        </div>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...ui.input, width: 180 }} />
      </div>

      {carregando ? (
        <div style={ui.emptyCell}>Carregando...</div>
      ) : (
        <>
          <div style={{ background: '#F4EAD9', color: '#8F6E3E', padding: '12px 16px', borderRadius: 10, fontSize: 12.5, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span>💡 Despesas (aluguel, serviços, outros) são registradas em <b>Contas a Pagar</b> — os cards abaixo somam automaticamente o que estiver cadastrado lá.</span>
            <Link href="/contas" style={{ ...ui.btnOutline, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ir para Contas a Pagar</Link>
          </div>

          <div style={ui.kpiGrid}>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(receita)}</div><div style={ui.kpiLabel}>Receita</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(lucro)}</div><div style={ui.kpiLabel}>Lucro</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(custos)}</div><div style={ui.kpiLabel}>Custos</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(despesas)}</div><div style={ui.kpiLabel}>Despesas</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(lucro)}</div><div style={ui.kpiLabel}>Saldo</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{brl(ticketMedio)}</div><div style={ui.kpiLabel}>Ticket médio</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{pagas}</div><div style={ui.kpiLabel}>Contas pagas</div></div>
            <div style={ui.kpiCard}><div style={{ ...ui.kpiValue, fontWeight: 500 }}>{pendVenc}</div><div style={ui.kpiLabel}>Contas pendentes / vencidas</div></div>
          </div>

          <div style={ui.panelPad}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Resumo por forma de pagamento</div>
            {totalPag === 0 ? (
              <div style={ui.emptyCell}>Sem vendas nesse mês.</div>
            ) : FORMAS.map((f) => {
              const pct = totalPag ? Math.round((porForma[f] / totalPag) * 100) : 0;
              return (
                <div key={f} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>{f}</span><span>{brl(porForma[f])} ({pct}%)</span>
                  </div>
                  <div style={{ height: 7, background: '#F1EEE8', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8F6E3E, #B8935A)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
