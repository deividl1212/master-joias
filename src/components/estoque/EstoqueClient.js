'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';

const MIN_ESTOQUE = 2;
const CATEGORIAS = ['Anéis', 'Colares', 'Pulseiras', 'Brincos', 'Carteiras', 'Bolsas', 'Óculos', 'Lenços', 'Outras joias'];

function brl(v) {
  return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function gerarCodigoInterno(supabase) {
  const { count } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
  const proximo = (count || 0) + 1;
  return 'MJ-' + String(proximo).padStart(6, '0');
}

export default function EstoqueClient({ produtosIniciais, erroCarregamento }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [produtos, setProdutos] = useState(produtosIniciais);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [modalProduto, setModalProduto] = useState(null); // null | 'novo' | produto (objeto pra editar)
  const [modalSaldo, setModalSaldo] = useState(null); // produto sendo ajustado
  const [modalExcluir, setModalExcluir] = useState(null); // produto a excluir
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({ nome: '', codigo: '', categoria: 'Anéis', marca: '', custo: '', venda: '', estoque: '' });
  const [novoSaldo, setNovoSaldo] = useState('');
  const previaBarcodeRef = useRef(null);
  const etiquetaBarcodeRef = useRef(null);
  const [etiquetaImprimir, setEtiquetaImprimir] = useState(null);

  useEffect(() => {
    if (etiquetaImprimir) {
      (async () => {
        const JsBarcode = (await import('jsbarcode')).default;
        setTimeout(() => {
          if (etiquetaBarcodeRef.current) {
            JsBarcode(etiquetaBarcodeRef.current, etiquetaImprimir.codigo, { format: 'CODE128', width: 1.2, height: 26, fontSize: 9, margin: 2 });
          }
          setTimeout(() => {
            window.print();
            setEtiquetaImprimir(null);
          }, 150);
        }, 0);
      })();
    }
  }, [etiquetaImprimir]);

  async function recarregar() {
    const { data } = await supabase.from('produtos').select('*').order('criado_em', { ascending: false });
    setProdutos(data || []);
  }

  const listaFiltrada = useMemo(() => {
    const termo = normalizar(busca);
    return produtos.filter((p) =>
      (normalizar(p.nome).includes(termo) || normalizar(p.codigo).includes(termo)) &&
      (!filtroCategoria || p.categoria === filtroCategoria)
    );
  }, [produtos, busca, filtroCategoria]);

  function abrirNovo() {
    setForm({ nome: '', codigo: '', categoria: 'Anéis', marca: '', custo: '', venda: '', estoque: '' });
    setModalProduto('novo');
  }
  function abrirEditar(p) {
    setForm({ nome: p.nome, codigo: p.codigo, categoria: p.categoria || 'Anéis', marca: p.marca || '', custo: p.custo, venda: p.venda, estoque: p.estoque });
    setModalProduto(p);
  }

  async function atualizarPreviaBarcode(codigo) {
    if (!codigo || !previaBarcodeRef.current) return;
    const JsBarcode = (await import('jsbarcode')).default;
    try {
      JsBarcode(previaBarcodeRef.current, codigo, { format: 'CODE128', width: 1.3, height: 30, fontSize: 10, margin: 4 });
    } catch {
      // código inválido para o formato — ignora a prévia
    }
  }

  async function salvarProduto(e) {
    e.preventDefault();
    if (!form.nome.trim()) { showToast('Informe o nome do produto.', 'error'); return; }
    setSalvando(true);

    const codigoFinal = form.codigo.trim() || await gerarCodigoInterno(supabase);
    const payload = {
      nome: form.nome.trim(),
      codigo: codigoFinal,
      categoria: form.categoria,
      marca: form.marca.trim(),
      custo: parseFloat(form.custo) || 0,
      venda: parseFloat(form.venda) || 0,
      estoque: parseInt(form.estoque) || 0,
    };

    let error;
    if (modalProduto === 'novo') {
      ({ error } = await supabase.from('produtos').insert(payload));
    } else {
      ({ error } = await supabase.from('produtos').update(payload).eq('id', modalProduto.id));
    }

    setSalvando(false);
    if (error) {
      if (error.code === '23505') showToast('Já existe um produto com esse código de barras.', 'error');
      else showToast('Erro ao salvar produto: ' + error.message, 'error');
      return;
    }
    showToast(modalProduto === 'novo' ? 'Produto cadastrado com sucesso.' : 'Produto atualizado com sucesso.');
    setModalProduto(null);
    recarregar();
  }

  function abrirAjusteSaldo(p) {
    setNovoSaldo(String(p.estoque));
    setModalSaldo(p);
  }
  async function salvarAjusteSaldo(e) {
    e.preventDefault();
    const valor = parseInt(novoSaldo);
    if (isNaN(valor) || valor < 0) { showToast('Informe uma quantidade válida.', 'error'); return; }
    setSalvando(true);
    const diff = valor - modalSaldo.estoque;

    const { error } = await supabase.from('produtos').update({ estoque: valor }).eq('id', modalSaldo.id);
    if (!error && diff !== 0) {
      await supabase.from('movimentos_estoque').insert({
        produto_id: modalSaldo.id, nome_produto: modalSaldo.nome, tipo: 'Ajuste',
        quantidade: Math.abs(diff), motivo: 'Edição manual de saldo',
      });
    }
    setSalvando(false);
    if (error) { showToast('Erro ao ajustar saldo: ' + error.message, 'error'); return; }
    showToast('Saldo atualizado com sucesso.');
    setModalSaldo(null);
    recarregar();
  }

  async function confirmarExclusao() {
    setSalvando(true);
    const { error } = await supabase.from('produtos').delete().eq('id', modalExcluir.id);
    setSalvando(false);
    if (error) { showToast('Erro ao excluir: ' + error.message, 'error'); return; }
    showToast('Produto excluído.');
    setModalExcluir(null);
    recarregar();
  }

  function imprimirEtiqueta(p) {
    setEtiquetaImprimir(p);
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={styles.toolbar}>
        <div>
          <h1 style={styles.h1}>Estoque</h1>
          <p style={styles.sub}>{produtos.length} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={abrirNovo} style={styles.btnGold}>+ Novo produto</button>
      </div>

      {erroCarregamento && (
        <div style={styles.erroBox}>Erro ao carregar produtos: {erroCarregamento}</div>
      )}

      <div style={styles.filtros}>
        <input
          placeholder="Buscar por nome ou código..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ ...styles.input, width: 260 }}
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={styles.input}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={styles.panel}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Produto', 'Código', 'Categoria', 'Marca', 'Custo', 'Venda', 'Estoque', 'Status', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr><td colSpan={9} style={styles.emptyCell}>
                  {produtos.length === 0 ? 'Nenhum produto cadastrado ainda.' : 'Nenhum resultado para essa busca.'}
                </td></tr>
              ) : listaFiltrada.map((p) => {
                const status = p.estoque === 0 ? { c: '#A85252', bg: '#F7EBEB', t: 'Sem estoque' }
                  : p.estoque <= MIN_ESTOQUE ? { c: '#8F6E3E', bg: '#F4EAD9', t: 'Estoque baixo' }
                  : { c: '#5B7B5A', bg: '#EEF3ED', t: 'Disponível' };
                return (
                  <tr key={p.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{p.nome}</td>
                    <td style={styles.td}>{p.codigo}</td>
                    <td style={styles.td}>{p.categoria || '—'}</td>
                    <td style={styles.td}>{p.marca || '—'}</td>
                    <td style={styles.td}>{brl(p.custo)}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{brl(p.venda)}</td>
                    <td style={styles.td}>{p.estoque} un.</td>
                    <td style={styles.td}><span style={{ ...styles.badge, color: status.c, background: status.bg }}>{status.t}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button title="Editar produto" onClick={() => abrirEditar(p)} style={styles.iconBtn}>✎</button>
                        <button title="Editar saldo" onClick={() => abrirAjusteSaldo(p)} style={styles.iconBtn}>≡</button>
                        <button title="Imprimir etiqueta" onClick={() => imprimirEtiqueta(p)} style={styles.iconBtn}>▤</button>
                        <button title="Excluir" onClick={() => setModalExcluir(p)} style={{ ...styles.iconBtn, color: '#A85252' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO/EDITAR PRODUTO */}
      {modalProduto && (
        <div style={styles.overlay} onClick={() => setModalProduto(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvarProduto} style={styles.modal}>
            <div style={styles.modalHead}>
              <b>{modalProduto === 'novo' ? 'Novo produto' : 'Editar produto'}</b>
              <button type="button" onClick={() => setModalProduto(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Nome do produto</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Código de barras</label>
                <input
                  value={form.codigo}
                  onChange={(e) => { setForm({ ...form, codigo: e.target.value }); atualizarPreviaBarcode(e.target.value); }}
                  placeholder="Bipe o código de fábrica ou deixe em branco"
                  style={styles.input}
                />
                <div style={styles.hint}>Se não tiver código de fábrica, deixe em branco — o sistema gera um automaticamente.</div>
                {form.codigo && <svg ref={previaBarcodeRef} style={{ marginTop: 8 }} />}
              </div>
              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>Categoria</label>
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={styles.input}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Marca</label>
                  <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>Preço de custo (R$)</label>
                  <input type="number" step="0.01" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Preço de venda (R$)</label>
                  <input type="number" step="0.01" value={form.venda} onChange={(e) => setForm({ ...form, venda: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Estoque</label>
                <input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} style={styles.input} />
                <div style={styles.hint}>Estoque mínimo padrão: {MIN_ESTOQUE} unidades (regra da loja)</div>
              </div>
            </div>
            <div style={styles.modalFoot}>
              <button type="button" onClick={() => setModalProduto(null)} style={styles.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={styles.btnGold}>{salvando ? 'Salvando...' : 'Salvar produto'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL AJUSTE DE SALDO */}
      {modalSaldo && (
        <div style={styles.overlay} onClick={() => setModalSaldo(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvarAjusteSaldo} style={{ ...styles.modal, maxWidth: 380 }}>
            <div style={styles.modalHead}><b>Editar saldo</b><button type="button" onClick={() => setModalSaldo(null)} style={styles.closeBtn}>✕</button></div>
            <div style={styles.modalBody}>
              <label style={styles.label}>{modalSaldo.nome} — saldo atual: {modalSaldo.estoque} un.</label>
              <input type="number" required value={novoSaldo} onChange={(e) => setNovoSaldo(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.modalFoot}>
              <button type="button" onClick={() => setModalSaldo(null)} style={styles.btnGhost}>Cancelar</button>
              <button type="submit" disabled={salvando} style={styles.btnGold}>{salvando ? 'Salvando...' : 'Salvar saldo'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {modalExcluir && (
        <div style={styles.overlay} onClick={() => setModalExcluir(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...styles.modal, maxWidth: 380 }}>
            <div style={styles.modalHead}><b>Excluir produto</b><button onClick={() => setModalExcluir(null)} style={styles.closeBtn}>✕</button></div>
            <div style={styles.modalBody}>Tem certeza que deseja excluir <b>{modalExcluir.nome}</b>? Essa ação não pode ser desfeita.</div>
            <div style={styles.modalFoot}>
              <button onClick={() => setModalExcluir(null)} style={styles.btnGhost}>Cancelar</button>
              <button onClick={confirmarExclusao} disabled={salvando} style={{ ...styles.btnGold, background: '#A85252' }}>
                {salvando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="print-area">
        {etiquetaImprimir && (
          <div style={{ width: 130, padding: 4, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{etiquetaImprimir.nome}</div>
            <svg ref={etiquetaBarcodeRef} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: 22, fontWeight: 800, margin: 0, color: '#1B1A18' },
  sub: { fontSize: 12.5, color: '#726A5D', margin: '4px 0 0' },
  erroBox: { background: '#F7EBEB', color: '#A85252', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  filtros: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  panel: { background: '#fff', border: '1px solid #E7E2D9', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '11px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#726A5D', borderBottom: '1px solid #E7E2D9', fontWeight: 700, whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', borderBottom: '1px solid #F1EEE8', whiteSpace: 'nowrap' },
  emptyCell: { padding: 40, textAlign: 'center', color: '#726A5D', fontSize: 13 },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid #E7E2D9', background: '#fff', cursor: 'pointer', fontSize: 12 },
  btnGold: { background: 'linear-gradient(135deg, #B8935A, #8F6E3E)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnGhost: { background: 'transparent', border: 'none', color: '#4B453C', padding: '11px 16px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  input: { padding: '10px 13px', borderRadius: 9, border: '1px solid #D6CFC2', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' },
  field: { marginBottom: 14 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B453C', marginBottom: 6 },
  hint: { fontSize: 11, color: '#9C9184', marginTop: 4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(27,26,24,.55)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 12px 32px rgba(0,0,0,.2)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #E7E2D9', fontSize: 15 },
  modalBody: { padding: '20px 22px', fontSize: 13.5, color: '#4B453C' },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid #E7E2D9', background: '#FAF8F5' },
  closeBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid #E7E2D9', background: '#fff', cursor: 'pointer' },
};
