'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';
import { ui, brl } from '@/lib/uiStyles';

export default function ClientesClient({ clientesIniciais, erroCarregamento }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [clientes, setClientes] = useState(clientesIniciais);
  const [busca, setBusca] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', cidade: '', ultima_compra: '', valor: '' });

  async function recarregar() {
    const { data } = await supabase.from('clientes').select('*').order('criado_em', { ascending: false });
    setClientes(data || []);
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.toLowerCase();
    return clientes.filter((c) =>
      c.nome.toLowerCase().includes(termo) ||
      (c.telefone || '').includes(termo) ||
      (c.cidade || '').toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  function abrirNovo() {
    setForm({ nome: '', telefone: '', cidade: '', ultima_compra: '', valor: '' });
    setModalNovo(true);
  }

  async function salvarCliente(e) {
    e.preventDefault();
    if (!form.nome.trim()) { showToast('Informe o nome do cliente.', 'error'); return; }
    setSalvando(true);
    const { error } = await supabase.from('clientes').insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      cidade: form.cidade.trim(),
      ultima_compra: form.ultima_compra || null,
      total_gasto: parseFloat(form.valor) || 0,
    });
    setSalvando(false);
    if (error) { showToast('Erro ao salvar cliente: ' + error.message, 'error'); return; }
    showToast('Cliente cadastrado com sucesso.');
    setModalNovo(false);
    recarregar();
  }

  async function confirmarExclusao() {
    setSalvando(true);
    const { error } = await supabase.from('clientes').delete().eq('id', modalExcluir.id);
    setSalvando(false);
    if (error) { showToast('Erro ao excluir: ' + error.message, 'error'); return; }
    showToast('Cliente excluído.');
    setModalExcluir(null);
    recarregar();
  }

  function iniciais(nome) {
    return (nome || '?').trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={ui.toolbar}>
        <div>
          <h1 style={ui.h1}>Clientes</h1>
          <p style={ui.sub}>{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <button onClick={abrirNovo} style={ui.btnGold}>+ Novo cliente</button>
      </div>

      {erroCarregamento && <div style={ui.erroBox}>Erro ao carregar clientes: {erroCarregamento}</div>}

      <div style={ui.filtros}>
        <input placeholder="Buscar por nome, telefone ou cidade..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...ui.input, width: 300 }} />
      </div>

      <div style={ui.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={ui.table}>
            <thead>
              <tr>{['Cliente', 'Telefone', 'Cidade', 'Última compra', 'Total gasto', ''].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr><td colSpan={6} style={ui.emptyCell}>{clientes.length === 0 ? 'Nenhum cliente cadastrado ainda.' : 'Nenhum resultado para essa busca.'}</td></tr>
              ) : listaFiltrada.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...ui.td, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F1EEE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#4B453C' }}>{iniciais(c.nome)}</div>
                      {c.nome}
                    </div>
                  </td>
                  <td style={ui.td}>{c.telefone || '—'}</td>
                  <td style={ui.td}>{c.cidade || '—'}</td>
                  <td style={ui.td}>{c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{brl(c.total_gasto)}</td>
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
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvarCliente} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Novo cliente<button type="button" onClick={() => setModalNovo(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={ui.field}>
                <label style={ui.label}>Nome</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={ui.input} />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Telefone</label>
                <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} style={ui.input} placeholder="(00) 00000-0000" />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Cidade</label>
                <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} style={ui.input} placeholder="Cidade - UF" />
              </div>
              <div style={ui.row2}>
                <div style={ui.field}>
                  <label style={ui.label}>Última compra (opcional)</label>
                  <input type="date" value={form.ultima_compra} onChange={(e) => setForm({ ...form, ultima_compra: e.target.value })} style={ui.input} />
                  <div style={ui.hint}>Preencha se o cliente já comprava antes do sistema.</div>
                </div>
                <div style={ui.field}>
                  <label style={ui.label}>Valor total gasto (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={ui.input} placeholder="0,00" />
                </div>
              </div>
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalNovo(false)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={ui.btnGold}>{salvando ? 'Salvando...' : 'Salvar cliente'}</button>
            </div>
          </form>
        </div>
      )}

      {modalExcluir && (
        <div style={ui.overlay} onClick={() => setModalExcluir(null)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Excluir cliente<button onClick={() => setModalExcluir(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>Tem certeza que deseja excluir <b>{modalExcluir.nome}</b>?</div>
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
