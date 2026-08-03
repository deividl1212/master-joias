'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';
import { ui, brl, badgeColor } from '@/lib/uiStyles';

export default function PromissoriasClient({ promissoriasIniciais, erroCarregamento }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [lista, setLista] = useState(promissoriasIniciais);
  const [filtroStatus, setFiltroStatus] = useState('Pendente');
  const [busca, setBusca] = useState('');
  const [modalRecebimento, setModalRecebimento] = useState(null);
  const [valorRecebimento, setValorRecebimento] = useState('');
  const [salvando, setSalvando] = useState(false);

  const listaFiltrada = lista.filter((p) =>
    (filtroStatus === 'Todas' || p.status === filtroStatus) &&
    p.cliente_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalEmAberto = lista.filter((p) => p.status === 'Pendente').reduce((s, p) => s + p.saldo_devedor, 0);

  function abrirRecebimento(p) {
    setValorRecebimento('');
    setModalRecebimento(p);
  }

  async function confirmarRecebimento(e) {
    e.preventDefault();
    const valor = parseFloat(valorRecebimento);
    if (!valor || valor <= 0) { showToast('Informe um valor válido.', 'error'); return; }
    setSalvando(true);

    const promissoria = modalRecebimento;
    const novoSaldo = Math.max(promissoria.saldo_devedor - valor, 0);
    const novoStatus = novoSaldo <= 0 ? 'Paga' : 'Pendente';

    const { error: erroRecebimento } = await supabase.from('promissoria_recebimentos').insert({
      promissoria_id: promissoria.id, valor,
    });
    if (erroRecebimento) { setSalvando(false); showToast('Erro ao registrar recebimento: ' + erroRecebimento.message, 'error'); return; }

    const { error: erroUpdate } = await supabase.from('promissorias')
      .update({ saldo_devedor: novoSaldo, status: novoStatus })
      .eq('id', promissoria.id);
    setSalvando(false);
    if (erroUpdate) { showToast('Erro ao atualizar promissória: ' + erroUpdate.message, 'error'); return; }

    showToast(novoStatus === 'Paga' ? 'Promissória quitada com sucesso!' : 'Recebimento registrado com sucesso.');
    setLista((prev) => prev.map((p) => (p.id === promissoria.id ? { ...p, saldo_devedor: novoSaldo, status: novoStatus } : p)));
    setModalRecebimento(null);
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={ui.kpiGrid}>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{brl(totalEmAberto)}</div><div style={ui.kpiLabel}>Total em aberto (a receber)</div></div>
        <div style={ui.kpiCard}><div style={ui.kpiValue}>{lista.filter((p) => p.status === 'Pendente').length}</div><div style={ui.kpiLabel}>Promissórias pendentes</div></div>
      </div>

      {erroCarregamento && <div style={ui.erroBox}>Erro ao carregar promissórias: {erroCarregamento}</div>}

      <div style={ui.filtros}>
        <input placeholder="Buscar por cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...ui.input, width: 240 }} />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={ui.input}>
          <option value="Pendente">Pendentes</option>
          <option value="Paga">Pagas</option>
          <option value="Todas">Todas</option>
        </select>
      </div>

      <div style={ui.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={ui.table}>
            <thead>
              <tr>{['Cliente', 'Valor total', 'Já pago', 'Saldo devedor', 'Status', ''].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr><td colSpan={6} style={ui.emptyCell}>Nenhuma promissória encontrada.</td></tr>
              ) : listaFiltrada.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...ui.td, fontWeight: 600 }}>{p.cliente_nome}</td>
                  <td style={ui.td}>{brl(p.valor_total)}</td>
                  <td style={ui.td}>{brl(p.valor_total - p.saldo_devedor)}</td>
                  <td style={{ ...ui.td, fontWeight: 700, color: p.status === 'Pendente' ? '#A85252' : undefined }}>{brl(p.saldo_devedor)}</td>
                  <td style={ui.td}>
                    <span style={{ ...ui.badge, ...(p.status === 'Pendente' ? badgeColor.red : badgeColor.green) }}>{p.status}</span>
                  </td>
                  <td style={ui.td}>
                    {p.status === 'Pendente' && (
                      <button onClick={() => abrirRecebimento(p)} style={ui.btnOutline}>Registrar recebimento</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalRecebimento && (
        <div style={ui.overlay} onClick={() => setModalRecebimento(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={confirmarRecebimento} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Registrar recebimento<button type="button" onClick={() => setModalRecebimento(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={{ marginBottom: 10 }}>
                <b>{modalRecebimento.cliente_nome}</b><br />
                Saldo devedor atual: <b>{brl(modalRecebimento.saldo_devedor)}</b>
              </div>
              <label style={ui.label}>Valor recebido agora (R$)</label>
              <input type="number" step="0.01" autoFocus value={valorRecebimento} onChange={(e) => setValorRecebimento(e.target.value)} style={ui.input} placeholder="0,00" />
              <div style={ui.hint}>Se o valor for igual ou maior que o saldo, a promissória fica quitada automaticamente.</div>
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalRecebimento(null)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={ui.btnGold}>{salvando ? 'Salvando...' : 'Confirmar recebimento'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}