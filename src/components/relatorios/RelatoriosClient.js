'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ui, brl } from '@/lib/uiStyles';

const TIPOS = [
  { id: 'vendas', label: 'Vendas', head: ['Data', 'Cliente', 'Pagamento', 'Total'] },
  { id: 'produtos', label: 'Produtos / Estoque', head: ['Produto', 'Código', 'Categoria', 'Estoque', 'Status'] },
  { id: 'clientes', label: 'Clientes', head: ['Cliente', 'Telefone', 'Cidade', 'Total gasto'] },
  { id: 'contas', label: 'Contas a pagar', head: ['Fornecedor', 'Categoria', 'Valor', 'Status'] },
  { id: 'despesas', label: 'Despesas', head: ['Fornecedor', 'Categoria', 'Descrição', 'Valor'] },
];
const MIN_ESTOQUE = 2;

export default function RelatoriosClient() {
  const supabase = createClient();
  const [tipo, setTipo] = useState('vendas');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const printAreaRef = useRef(null);
  const tipoAtual = TIPOS.find((t) => t.id === tipo);

  async function gerar() {
    setCarregando(true);
    setGerado(true);
    let dados = [];

    if (tipo === 'vendas') {
      let q = supabase.from('vendas').select('*').order('criado_em', { ascending: false });
      if (dataIni) q = q.gte('criado_em', new Date(dataIni).toISOString());
      if (dataFim) q = q.lte('criado_em', new Date(dataFim + 'T23:59:59').toISOString());
      const { data } = await q;
      dados = (data || []).map((v) => [new Date(v.criado_em).toLocaleDateString('pt-BR'), v.cliente_nome, v.pagamento, brl(v.total)]);
    } else if (tipo === 'produtos') {
      const { data } = await supabase.from('produtos').select('*').order('nome');
      dados = (data || []).map((p) => [p.nome, p.codigo, p.categoria || '—', p.estoque, p.estoque === 0 ? 'Sem estoque' : p.estoque <= MIN_ESTOQUE ? 'Estoque baixo' : 'Disponível']);
    } else if (tipo === 'clientes') {
      const { data } = await supabase.from('clientes').select('*').order('nome');
      dados = (data || []).map((c) => [c.nome, c.telefone || '—', c.cidade || '—', brl(c.total_gasto)]);
    } else if (tipo === 'contas') {
      const { data } = await supabase.from('contas_pagar').select('*, fornecedores(fantasia)');
      dados = (data || []).map((c) => [c.fornecedores?.fantasia || 'Não vinculado', c.categoria, brl(c.valor), c.status]);
    } else if (tipo === 'despesas') {
      const { data } = await supabase.from('contas_pagar').select('*, fornecedores(fantasia)').neq('categoria', 'Compra de mercadoria');
      dados = (data || []).map((c) => [c.fornecedores?.fantasia || 'Não vinculado', c.categoria, c.descricao || '—', brl(c.valor)]);
    }
    setLinhas(dados);
    setCarregando(false);
  }

  function imprimir() {
    const linhasHtml = linhas.map((l) =>
      `<tr>${l.map((c) => `<td style="padding:8px 6px;border-bottom:1px solid #eee;">${c}</td>`).join('')}</tr>`
    ).join('');

    let linhaTotal = '';
    if (tipo === 'vendas' && linhas.length > 0) {
      const totalGeral = linhas.reduce((s, l) => {
        const valorNum = parseFloat(String(l[l.length - 1]).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
        return s + (isNaN(valorNum) ? 0 : valorNum);
      }, 0);
      linhaTotal = `<tr><td colspan="${tipoAtual.head.length - 1}" style="padding:10px 6px; text-align:right; font-weight:800; border-top:2px solid #1B1A18;">Total geral</td><td style="padding:10px 6px; font-weight:800; border-top:2px solid #1B1A18;">${brl(totalGeral)}</td></tr>`;
    }

    const html = `
      <div style="font-family:Inter,sans-serif; padding:28px; max-width:700px; margin:0 auto;">
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:22px;">
         <img src="/logo-master-joias.png" alt="Master Joias" style="height:80px; object-fit:contain; margin-bottom:10px;" />
          <h2 style="margin:0; font-size:18px;">${tipoAtual.label}</h2>
          <div style="font-size:12px; color:#726A5D; margin-top:2px;">Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>${tipoAtual.head.map((h) => `<th style="text-align:left;border-bottom:2px solid #1B1A18;padding:8px 6px;">${h}</th>`).join('')}</tr></thead>
          <tbody>${linhasHtml}${linhaTotal}</tbody>
        </table>
      </div>
    `;
    if (printAreaRef.current) {
      printAreaRef.current.innerHTML = html;
    }
    window.print();
  }

  function exportarCsv() {
    const rows = [tipoAtual.head.join(';'), ...linhas.map((l) => l.join(';'))];
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio-${tipo}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="kpi-grid-responsive" style={{ ...ui.kpiGrid, marginBottom: 24 }}>
        {TIPOS.map((t) => (
          <div key={t.id} onClick={() => { setTipo(t.id); setGerado(false); }} style={{
            ...ui.kpiCard, cursor: 'pointer', border: tipo === t.id ? '1.5px solid #B8935A' : '1px solid #E7E2D9',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={ui.panelPad}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Relatório de {tipoAtual.label.toLowerCase()}</div>

        {tipo === 'vendas' && (
          <div style={{ ...ui.filtros, marginBottom: 16 }}>
            <div><label style={ui.label}>Data inicial</label><input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} style={ui.input} /></div>
            <div><label style={ui.label}>Data final</label><input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={ui.input} /></div>
          </div>
        )}

        <div style={ui.toolbarActions}>
          <button onClick={gerar} style={ui.btnOutline}>Gerar relatório</button>
          <button onClick={imprimir} disabled={!gerado} style={ui.btnOutline}>Imprimir</button>
          <button onClick={exportarCsv} disabled={!gerado} style={ui.btnGold}>Exportar (CSV)</button>
        </div>

        {gerado && (
          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table style={ui.table}>
              <thead><tr>{tipoAtual.head.map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={tipoAtual.head.length} style={ui.emptyCell}>Carregando...</td></tr>
                ) : linhas.length === 0 ? (
                  <tr><td colSpan={tipoAtual.head.length} style={ui.emptyCell}>Nenhum resultado encontrado.</td></tr>
                ) : linhas.map((l, i) => (
                  <tr key={i}>{l.map((c, j) => <td key={j} style={ui.td}>{c}</td>)}</tr>
                ))}
                {tipo === 'vendas' && linhas.length > 0 && (
                  <tr>
                    <td colSpan={tipoAtual.head.length - 1} style={{ ...ui.td, textAlign: 'right', fontWeight: 800, borderTop: '2px solid #1B1A18' }}>Total geral</td>
                    <td style={{ ...ui.td, fontWeight: 800, borderTop: '2px solid #1B1A18' }}>
                      {brl(linhas.reduce((s, l) => {
                        const n = parseFloat(String(l[l.length - 1]).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                        return s + (isNaN(n) ? 0 : n);
                      }, 0))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div id="print-area" ref={printAreaRef}></div>
    </div>
  );
}