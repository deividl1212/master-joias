'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';
import { ui, brl, badgeColor } from '@/lib/uiStyles';

const CATEGORIAS = ['Compra de mercadoria', 'Aluguel', 'Serviços', 'Outros'];
const STATUS = ['Pendente', 'Pago', 'Vencido'];
const STATUS_COR = { Pago: 'green', Pendente: 'gold', Vencido: 'red' };

export default function ContasClient({ contasIniciais, fornecedores, erroCarregamento }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [contas, setContas] = useState(contasIniciais);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ fornecedor_id: '', categoria: CATEGORIAS[0], valor: '', descricao: '', status: 'Pendente', nota_fiscal: '' });

  async function recarregar() {
    const { data } = await supabase.from('contas_pagar').select('*, fornecedores(fantasia)').order('criado_em', { ascending: false });
    setContas(data || []);
  }

  function abrirNovo() {
    setForm({ fornecedor_id: fornecedores[0]?.id || '', categoria: CATEGORIAS[0], valor: '', descricao: '', status: 'Pendente', nota_fiscal: '' });
    setModalNovo(true);
  }

  async function salvarConta(e) {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!valor) { showToast('Informe o valor da conta.', 'error'); return; }
    setSalvando(true);
    const { error } = await supabase.from('contas_pagar').insert({
      fornecedor_id: form.fornecedor_id || null,
      categoria: form.categoria,
      valor,
      descricao: form.descricao.trim(),
      status: form.status,
      nota_fiscal: form.nota_fiscal.trim(),
    });
    setSalvando(false);
    if (error) { showToast('Erro ao salvar conta: ' + error.message, 'error'); return; }
    showToast('Conta cadastrada com sucesso.');
    setModalNovo(false);
    recarregar();
  }

  async function confirmarExclusao() {
    setSalvando(true);
    const { error } = await supabase.from('contas_pagar').delete().eq('id', modalExcluir.id);
    setSalvando(false);
    if (error) { showToast('Erro ao excluir: ' + error.message, 'error'); return; }
    showToast('Conta excluída.');
    setModalExcluir(null);
    recarregar();
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={ui.toolbar}>
        <div>
          <h1 style={ui.h1}>Contas a Pagar</h1>
          <p style={ui.sub}>{contas.length} conta(s) cadastrada(s)</p>
        </div>
        <button onClick={abrirNovo} style={ui.btnGold}>+ Nova conta</button>
      </div>

      {erroCarregamento && <div style={ui.erroBox}>Erro ao carregar contas: {erroCarregamento}</div>}
      {fornecedores.length === 0 && (
        <div style={{ ...ui.erroBox, background: '#F4EAD9', color: '#8F6E3E' }}>
          Nenhum fornecedor cadastrado ainda — cadastre um fornecedor primeiro para poder vincular às contas.
        </div>
      )}

      <div style={ui.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={ui.table}>
            <thead>
              <tr>{['Fornecedor', 'Categoria', 'Descrição', 'Valor', 'NF', 'Status', ''].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {contas.length === 0 ? (
                <tr><td colSpan={7} style={ui.emptyCell}>Nenhuma conta cadastrada ainda.</td></tr>
              ) : contas.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{c.fornecedores?.fantasia || 'Não vinculado'}</td>
                  <td style={ui.td}>{c.categoria}</td>
                  <td style={ui.td}>{c.descricao || '—'}</td>
                  <td style={ui.td}>{brl(c.valor)}</td>
                  <td style={ui.td}>{c.nota_fiscal || '—'}</td>
                  <td style={ui.td}><span style={{ ...ui.badge, ...badgeColor[STATUS_COR[c.status]] }}>{c.status}</span></td>
                  <td style={ui.td}>
                    <button title="Excluir" onClick={() => setModalExcluir(c)} style={{ ...ui.iconBtn, color: '#A85252' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalNovo && (
        <div style={ui.overlay} onClick={() => setModalNovo(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvarConta} style={ui.modal}>
            <div style={ui.modalHead}>Nova conta a pagar<button type="button" onClick={() => setModalNovo(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={ui.field}>
                <label style={ui.label}>Fornecedor</label>
                <select value={form.fornecedor_id} onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })} style={ui.input}>
                  <option value="">Não vinculado</option>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.fantasia}</option>)}
                </select>
              </div>
              <div style={ui.row2}>
                <div style={ui.field}>
                  <label style={ui.label}>Categoria</label>
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={ui.input}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={ui.field}>
                  <label style={ui.label}>Valor (R$)</label>
                  <input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={ui.input} />
                </div>
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={ui.input}>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Descrição (opcional)</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={ui.input} />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Número da nota fiscal</label>
                <input value={form.nota_fiscal} onChange={(e) => setForm({ ...form, nota_fiscal: e.target.value })} style={ui.input} />
              </div>
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalNovo(false)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={ui.btnGold}>{salvando ? 'Salvando...' : 'Salvar conta'}</button>
            </div>
          </form>
        </div>
      )}

      {modalExcluir && (
        <div style={ui.overlay} onClick={() => setModalExcluir(null)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Excluir conta<button onClick={() => setModalExcluir(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>Tem certeza que deseja excluir esta conta?</div>
            <div style={ui.modalFoot}>
              <button onClick={() => setModalExcluir(null)} style={ui.btnGhost}>Cancelar</button>
              <button onClick={confirmarExclusao} disabled={salvando} style={ui.btnDanger}>{salvando ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
