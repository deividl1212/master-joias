'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';
import { ui } from '@/lib/uiStyles';

export default function FornecedoresClient({ fornecedoresIniciais, erroCarregamento }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ razao_social: '', fantasia: '', cnpj: '', responsavel: '' });

  async function recarregar() {
    const { data } = await supabase.from('fornecedores').select('*').order('criado_em', { ascending: false });
    setFornecedores(data || []);
  }

  function abrirNovo() {
    setForm({ razao_social: '', fantasia: '', cnpj: '', responsavel: '' });
    setModalNovo(true);
  }

  async function salvarFornecedor(e) {
    e.preventDefault();
    if (!form.razao_social.trim()) { showToast('Informe a razão social.', 'error'); return; }
    setSalvando(true);
    const { error } = await supabase.from('fornecedores').insert({
      razao_social: form.razao_social.trim(),
      fantasia: form.fantasia.trim() || form.razao_social.trim(),
      cnpj: form.cnpj.trim(),
      responsavel: form.responsavel.trim(),
    });
    setSalvando(false);
    if (error) { showToast('Erro ao salvar fornecedor: ' + error.message, 'error'); return; }
    showToast('Fornecedor cadastrado com sucesso.');
    setModalNovo(false);
    recarregar();
  }

  async function confirmarExclusao() {
    setSalvando(true);
    const { error } = await supabase.from('fornecedores').delete().eq('id', modalExcluir.id);
    setSalvando(false);
    if (error) { showToast('Erro ao excluir: ' + error.message, 'error'); return; }
    showToast('Fornecedor excluído.');
    setModalExcluir(null);
    recarregar();
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={ui.toolbar}>
        <div>
          <h1 style={ui.h1}>Fornecedores</h1>
          <p style={ui.sub}>{fornecedores.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <button onClick={abrirNovo} style={ui.btnGold}>+ Novo fornecedor</button>
      </div>

      {erroCarregamento && <div style={ui.erroBox}>Erro ao carregar fornecedores: {erroCarregamento}</div>}

      <div style={ui.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={ui.table}>
            <thead>
              <tr>{['Nome fantasia', 'Razão social', 'CNPJ', 'Responsável', ''].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fornecedores.length === 0 ? (
                <tr><td colSpan={5} style={ui.emptyCell}>Nenhum fornecedor cadastrado ainda.</td></tr>
              ) : fornecedores.map((f) => (
                <tr key={f.id}>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{f.fantasia}</td>
                  <td style={ui.td}>{f.razao_social}</td>
                  <td style={ui.td}>{f.cnpj || '—'}</td>
                  <td style={ui.td}>{f.responsavel || '—'}</td>
                  <td style={ui.td}>
                    <button title="Excluir" onClick={() => setModalExcluir(f)} style={{ ...ui.iconBtn, color: '#A85252' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalNovo && (
        <div style={ui.overlay} onClick={() => setModalNovo(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvarFornecedor} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Novo fornecedor<button type="button" onClick={() => setModalNovo(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={ui.field}>
                <label style={ui.label}>Razão social</label>
                <input required value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} style={ui.input} />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Nome fantasia</label>
                <input value={form.fantasia} onChange={(e) => setForm({ ...form, fantasia: e.target.value })} style={ui.input} />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>CNPJ (opcional)</label>
                <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} style={ui.input} placeholder="00.000.000/0001-00" />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Responsável</label>
                <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} style={ui.input} />
              </div>
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalNovo(false)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={ui.btnGold}>{salvando ? 'Salvando...' : 'Salvar fornecedor'}</button>
            </div>
          </form>
        </div>
      )}

      {modalExcluir && (
        <div style={ui.overlay} onClick={() => setModalExcluir(null)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Excluir fornecedor<button onClick={() => setModalExcluir(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>Tem certeza que deseja excluir <b>{modalExcluir.fantasia}</b>?</div>
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
