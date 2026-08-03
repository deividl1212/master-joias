'use client';

import { useState, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Toast from '@/components/ui/Toast';
import { useToasts } from '@/hooks/useToasts';
import { ui, brl } from '@/lib/uiStyles';

const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Promissória'];

export default function PdvClient({ produtosIniciais, clientesIniciais, caixaInicial, ultimasVendasIniciais }) {
  const supabase = createClient();
  const { toasts, showToast } = useToasts();

  const [produtos, setProdutos] = useState(produtosIniciais);
  const [clientes] = useState(clientesIniciais);
  const [caixa, setCaixa] = useState(caixaInicial);
  const [ultimasVendas, setUltimasVendas] = useState(ultimasVendasIniciais);

  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState([]);
  const [clienteNome, setClienteNome] = useState('');
  const [desconto, setDesconto] = useState('');
  const [acrescimo, setAcrescimo] = useState('');
  const [pagamento, setPagamento] = useState('Pix');
  const [parcelas, setParcelas] = useState(1);
  const [valorEntrada, setValorEntrada] = useState('');
  const [processando, setProcessando] = useState(false);

  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [valorInicialCaixa, setValorInicialCaixa] = useState('');
  const [modalSangria, setModalSangria] = useState(false);
  const [sangriaValor, setSangriaValor] = useState('');
  const [sangriaMotivo, setSangriaMotivo] = useState('');
  const [modalFechar, setModalFechar] = useState(false);
  const [modalExcluirVenda, setModalExcluirVenda] = useState(null);
  const [excluindoVenda, setExcluindoVenda] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [recibo, setRecibo] = useState(null);
  const printAreaRef = useRef(null);

  const resultados = useMemo(() => {
    if (!busca.trim()) return [];
    const termo = busca.toLowerCase();
    return produtos.filter((p) => p.estoque > 0 && (p.nome.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo)));
  }, [produtos, busca]);

  const subtotal = cart.reduce((s, i) => s + i.preco * i.qty, 0);
  const total = Math.max(subtotal - (parseFloat(desconto) || 0) + (parseFloat(acrescimo) || 0), 0);

  async function recarregarProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('nome');
    setProdutos(data || []);
  }
  async function recarregarVendas() {
    const { data } = await supabase.from('vendas').select('*, venda_itens(*)').order('criado_em', { ascending: false }).limit(8);
    setUltimasVendas(data || []);
  }

  // ---------- CAIXA ----------
  async function abrirCaixa(e) {
    e.preventDefault();
    const valor = parseFloat(valorInicialCaixa) || 0;
    const { data, error } = await supabase.from('caixa').insert({ valor_inicial: valor, aberto: true }).select().single();
    if (error) { showToast('Erro ao abrir caixa: ' + error.message, 'error'); return; }
    setCaixa(data);
    setModalAbrirCaixa(false);
    setValorInicialCaixa('');
    showToast('Caixa aberto com sucesso.');
  }

  async function registrarSangria(e) {
    e.preventDefault();
    const valor = parseFloat(sangriaValor) || 0;
    if (!valor) { showToast('Informe o valor da sangria.', 'error'); return; }
    const { error } = await supabase.from('caixa_sangrias').insert({ caixa_id: caixa.id, valor, motivo: sangriaMotivo.trim() });
    if (error) { showToast('Erro ao registrar sangria: ' + error.message, 'error'); return; }
    setModalSangria(false);
    setSangriaValor('');
    setSangriaMotivo('');
    showToast('Sangria registrada com sucesso.');
  }

  async function confirmarFecharCaixa() {
    const { error } = await supabase.from('caixa').update({ aberto: false, fechado_em: new Date().toISOString() }).eq('id', caixa.id);
    if (error) { showToast('Erro ao fechar caixa: ' + error.message, 'error'); return; }
    setCaixa(null);
    setModalFechar(false);
    showToast('Caixa fechado com sucesso.');
  }

  async function confirmarExcluirVenda() {
    setExcluindoVenda(true);
    const venda = modalExcluirVenda;

    const { data: itensVenda } = await supabase.from('venda_itens').select('*').eq('venda_id', venda.id);

    for (const item of itensVenda || []) {
      if (!item.produto_id) continue;
      const { data: produtoAtual } = await supabase.from('produtos').select('estoque, nome').eq('id', item.produto_id).single();
      if (produtoAtual) {
        const novoEstoque = (produtoAtual.estoque || 0) + item.quantidade;
        await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.produto_id);
        await supabase.from('movimentos_estoque').insert({
          produto_id: item.produto_id, nome_produto: produtoAtual.nome, tipo: 'Entrada',
          quantidade: item.quantidade, motivo: 'Estorno — venda excluída',
        });
      }
    }

    await supabase.from('venda_itens').delete().eq('venda_id', venda.id);
    const { error } = await supabase.from('vendas').delete().eq('id', venda.id);
    setExcluindoVenda(false);
    if (error) { showToast('Erro ao excluir venda: ' + error.message, 'error'); return; }
    showToast('Venda excluída e estoque devolvido com sucesso.');
    setModalExcluirVenda(null);
    recarregarVendas();
    recarregarProdutos();
  }

  // ---------- CARRINHO ----------
  function addToCart(produto) {
    setCart((prev) => {
      const existente = prev.find((i) => i.produto_id === produto.id);
      if (existente) {
        if (existente.qty >= produto.estoque) { showToast('Quantidade máxima em estoque atingida.', 'error'); return prev; }
        return prev.map((i) => i.produto_id === produto.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { produto_id: produto.id, nome: produto.nome, preco: produto.venda, qty: 1, estoqueMax: produto.estoque }];
    });
  }
  function changeQty(idx, delta) {
    setCart((prev) => {
      const item = prev[idx];
      if (delta > 0 && item.qty >= item.estoqueMax) { showToast('Quantidade máxima em estoque atingida.', 'error'); return prev; }
      const novaQty = item.qty + delta;
      if (novaQty <= 0) return prev.filter((_, i) => i !== idx);
      return prev.map((i, ix) => ix === idx ? { ...i, qty: novaQty } : i);
    });
  }
  function removeItem(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleBarcodeEnter(e) {
    if (e.key !== 'Enter') return;
    const codigo = busca.trim();
    if (!codigo) return;
    const produto = produtos.find((p) => p.codigo.toLowerCase() === codigo.toLowerCase());
    if (!produto) { showToast('Nenhum produto encontrado com esse código.', 'error'); return; }
    if (produto.estoque <= 0) { showToast(`"${produto.nome}" está sem estoque.`, 'error'); return; }
    addToCart(produto);
    showToast(`${produto.nome} adicionado ao carrinho.`);
    setBusca('');
  }

  function abrirConfirmacao() {
    if (!caixa) { showToast('Abra o caixa antes de iniciar uma venda.', 'error'); return; }
    if (cart.length === 0) { showToast('Adicione ao menos um produto ao carrinho.', 'error'); return; }
    if (pagamento === 'Promissória') {
      if (!clienteNome.trim()) { showToast('Informe o nome do cliente para registrar a promissória.', 'error'); return; }
      const entrada = parseFloat(valorEntrada) || 0;
      if (entrada < 0 || entrada > total) { showToast('O valor de entrada não pode ser maior que o total da venda.', 'error'); return; }
    }
    setModalConfirmar(true);
  }

  async function finalizarVenda() {
    setProcessando(true);
    const clienteExistente = clienteNome.trim()
      ? clientes.find((c) => c.nome.toLowerCase() === clienteNome.trim().toLowerCase())
      : null;

    const ehPromissoria = pagamento === 'Promissória';
    const valorEntradaFinal = ehPromissoria ? Math.min(parseFloat(valorEntrada) || 0, total) : total;
    const valorPromissoriaFinal = ehPromissoria ? Math.max(total - valorEntradaFinal, 0) : 0;

    const { data: venda, error: erroVenda } = await supabase.from('vendas').insert({
      caixa_id: caixa.id,
      cliente_nome: clienteNome.trim() || 'Cliente não identificado',
      cliente_id: clienteExistente?.id || null,
      subtotal, desconto: parseFloat(desconto) || 0, acrescimo: parseFloat(acrescimo) || 0, total,
      pagamento, parcelas: pagamento === 'Crédito' ? parcelas : 1,
      valor_entrada: valorEntradaFinal, valor_promissoria: valorPromissoriaFinal,
    }).select().single();

    if (erroVenda) { setProcessando(false); showToast('Erro ao registrar venda: ' + erroVenda.message, 'error'); return; }

    if (ehPromissoria && valorPromissoriaFinal > 0) {
      await supabase.from('promissorias').insert({
        venda_id: venda.id,
        cliente_id: clienteExistente?.id || null,
        cliente_nome: clienteNome.trim() || 'Cliente não identificado',
        valor_total: valorPromissoriaFinal,
        saldo_devedor: valorPromissoriaFinal,
        status: 'Pendente',
      });
    }

    const itensPayload = cart.map((i) => ({ venda_id: venda.id, produto_id: i.produto_id, nome_produto: i.nome, quantidade: i.qty, preco_unitario: i.preco }));
    await supabase.from('venda_itens').insert(itensPayload);

    for (const item of cart) {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const novoEstoque = Math.max((produto?.estoque || 0) - item.qty, 0);
      await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.produto_id);
      await supabase.from('movimentos_estoque').insert({ produto_id: item.produto_id, nome_produto: item.nome, tipo: 'Saída', quantidade: item.qty, motivo: 'Venda PDV' });
    }

    if (clienteExistente) {
      await supabase.from('clientes').update({
        total_gasto: (clienteExistente.total_gasto || 0) + total,
        ultima_compra: new Date().toISOString().slice(0, 10),
      }).eq('id', clienteExistente.id);
    }

    setProcessando(false);
    setModalConfirmar(false);
    setRecibo({ ...venda, itens: cart });
    setCart([]);
    setClienteNome('');
    setDesconto('');
    setAcrescimo('');
    setPagamento('Pix');
    setParcelas(1);
    setValorEntrada('');
    recarregarProdutos();
    recarregarVendas();
  }

  function imprimirRecibo(venda, itens) {
    const listaItens = itens || [];
    const linhasItens = listaItens.map((i) =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;"><span>${i.qty || i.quantidade}x ${i.nome || i.nome_produto}</span><span>${brl((i.preco || i.preco_unitario) * (i.qty || i.quantidade))}</span></div>`
    ).join('');
    const html = `
      <div style="font-family:Inter,sans-serif; width:280px; padding:14px;">
        <div style="text-align:center; font-weight:800; font-size:15px;">MASTER JOIAS</div>
        <div style="text-align:center; font-size:11px; color:#726A5D;">${new Date(venda.criado_em || Date.now()).toLocaleString('pt-BR')}</div>
        <hr>
        <div style="font-size:12px;">Cliente: ${venda.cliente_nome}</div>
        <div style="font-size:12px;">Pagamento: ${venda.pagamento}${venda.parcelas > 1 ? ` (${venda.parcelas}x de ${brl(venda.total / venda.parcelas)})` : ''}${venda.pagamento === 'Promissória' && venda.valor_promissoria > 0 ? ` — entrada de ${brl(venda.valor_entrada)}, restante de ${brl(venda.valor_promissoria)} em promissória` : ''}</div>
        <hr>
        ${linhasItens}
        <hr>
        <div style="display:flex;justify-content:space-between;font-size:12px;"><span>Subtotal</span><span>${brl(venda.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;"><span>Desconto</span><span>- ${brl(venda.desconto)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;"><span>Acréscimo</span><span>+ ${brl(venda.acrescimo)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;margin-top:6px;"><span>Total</span><span>${brl(venda.total)}</span></div>
        <hr>
        <div style="text-align:center;font-size:11px;color:#726A5D;">Obrigado pela preferência!</div>
      </div>
    `;
    if (printAreaRef.current) {
      printAreaRef.current.innerHTML = html;
    }
    window.print();
  }

  return (
    <div>
      <Toast toasts={toasts} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, color: '#726A5D', marginBottom: 14 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: caixa ? '#5B7B5A' : '#D6CFC2', flexShrink: 0 }} />
        {caixa ? `Caixa aberto · Fundo: ${brl(caixa.valor_inicial)}` : 'Caixa fechado'}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!caixa && <button onClick={() => setModalAbrirCaixa(true)} style={ui.btnOutline}>Abrir caixa</button>}
          {caixa && <button onClick={() => setModalSangria(true)} style={ui.btnOutline}>Sangria</button>}
          {caixa && <button onClick={() => setModalFechar(true)} style={{ ...ui.btnOutline, color: '#A85252', borderColor: '#A85252' }}>Fechar caixa</button>}
        </div>
      </div>

      <div className="pdv-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gridTemplateRows: 'auto auto', gap: 18, alignItems: 'start' }}>
        <div className="pdv-col-busca" style={{ gridColumn: '1', gridRow: '1' }}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            placeholder="Buscar por nome ou bipar código de barras..."
            style={{ ...ui.input, padding: '14px 16px', border: '1.5px solid #B8935A', fontSize: 14, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {busca.trim() === '' ? (
              <div style={ui.emptyCell}>Digite para buscar um produto.</div>
            ) : resultados.length === 0 ? (
              <div style={ui.emptyCell}>Nenhum produto encontrado.</div>
            ) : resultados.map((p) => (
              <div key={p.id} onClick={() => addToCart(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #E7E2D9', borderRadius: 12, cursor: 'pointer', background: '#fff' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nome}</div>
                  <div style={{ fontSize: 11.5, color: '#9C9184' }}>Cód. {p.codigo} · Estoque: {p.estoque}</div>
                </div>
                <div style={{ fontWeight: 600 }}>{brl(p.venda)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CARRINHO */}
        <div className="pdv-col-carrinho" style={{ ...ui.panel, border: '1.5px solid #B8935A', position: 'sticky', top: 84, gridColumn: '2', gridRow: '1 / span 2' }}>
          <div style={{ background: '#1B1A18', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between' }}>
            <b style={{ fontSize: 13, letterSpacing: 1 }}>CARRINHO</b>
            <span style={{ fontSize: 11.5 }}>{cart.reduce((s, i) => s + i.qty, 0)} itens</span>
          </div>
          <div style={{ padding: 18 }}>
            <div style={ui.field}>
              <label style={ui.label}>Nome do cliente (opcional)</label>
              <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} style={ui.input} placeholder="Nome que vai aparecer no comprovante" />
            </div>

            {cart.length === 0 ? (
              <div style={ui.emptyCell}>Nenhum produto adicionado</div>
            ) : cart.map((item, idx) => (
              <div key={item.produto_id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, rowGap: 10, padding: '14px', marginBottom: 10, border: '1px solid #E7E2D9', borderRadius: 12, background: '#FAF8F5' }}>
                <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                  <div style={{ fontSize: 11.5, color: '#9C9184' }}>{brl(item.preco)} un.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #D6CFC2', borderRadius: 10, background: '#fff', padding: '4px 6px', flexShrink: 0 }}>
                  <button onClick={() => changeQty(idx, -1)} style={{ border: 'none', background: 'none', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 15, color: '#4B453C' }}>−</button>
                  <span style={{ fontSize: 13.5, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => changeQty(idx, 1)} style={{ border: 'none', background: 'none', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 15, color: '#4B453C' }}>+</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, minWidth: 70, textAlign: 'right', flexShrink: 0 }}>{brl(item.preco * item.qty)}</div>
                <button onClick={() => removeItem(idx)} style={{ ...ui.iconBtn, color: '#A85252', height: 28, width: 28, flexShrink: 0 }}>✕</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1 }}>
                <label style={ui.label}>Desconto (R$)</label>
                <input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} style={ui.input} placeholder="0,00" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={ui.label}>Acréscimo (R$)</label>
                <input type="number" value={acrescimo} onChange={(e) => setAcrescimo(e.target.value)} style={ui.input} placeholder="0,00" />
              </div>
            </div>

            <label style={ui.label}>Forma de pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {FORMAS_PAGAMENTO.map((f) => (
                <div key={f} onClick={() => setPagamento(f)} style={{
                  border: `1.5px solid ${pagamento === f ? '#B8935A' : '#E7E2D9'}`, borderRadius: 10, padding: 10, textAlign: 'center',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: pagamento === f ? '#FBF6EC' : '#fff', color: pagamento === f ? '#8F6E3E' : '#4B453C',
                }}>{f}</div>
              ))}
            </div>

            {pagamento === 'Crédito' && (
              <div style={ui.field}>
                <label style={ui.label}>Dividido em quantas vezes?</label>
                <select value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value))} style={ui.input}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x {n > 1 ? `de ${brl(total / n)}` : '(à vista)'}</option>)}
                </select>
              </div>
            )}

            {pagamento === 'Promissória' && (
              <div style={ui.field}>
                <label style={ui.label}>Valor de entrada (R$)</label>
                <input type="number" step="0.01" value={valorEntrada} onChange={(e) => setValorEntrada(e.target.value)} style={ui.input} placeholder="0,00" />
                <div style={ui.hint}>
                  {(() => {
                    const entrada = Math.min(parseFloat(valorEntrada) || 0, total);
                    const financiado = Math.max(total - entrada, 0);
                    return financiado > 0
                      ? `Restam ${brl(financiado)} em aberto na conta de ${clienteNome.trim() || 'cliente'} (promissória).`
                      : 'Sem valor financiado — a venda inteira será paga agora.';
                  })()}
                </div>
              </div>
            )}

            <div style={{ fontSize: 13.5, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div style={{ fontSize: 13.5, display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#A85252' }}><span>Desconto</span><span>- {brl(parseFloat(desconto) || 0)}</span></div>
            <div style={{ fontSize: 13.5, display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#5B7B5A' }}><span>Acréscimo</span><span>+ {brl(parseFloat(acrescimo) || 0)}</span></div>
            <div style={{ fontSize: 20, fontWeight: 800, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E7E2D9', marginTop: 8, paddingTop: 10 }}><span>Total</span><span>{brl(total)}</span></div>

            <button onClick={abrirConfirmacao} style={{ ...ui.btnGold, width: '100%', marginTop: 14, padding: 14 }}>Finalizar venda</button>
          </div>
        </div>

        <div className="pdv-col-vendas" style={{ ...ui.panel, gridColumn: '1', gridRow: '2' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7E2D9', fontWeight: 700, fontSize: 14 }}>Últimas vendas</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={ui.table}>
              <thead><tr>{['Data', 'Hora', 'Cliente', 'Produtos', 'Total', 'Pagamento', ''].map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
              <tbody>
                {ultimasVendas.length === 0 ? (
                  <tr><td colSpan={7} style={ui.emptyCell}>Nenhuma venda registrada ainda.</td></tr>
                ) : ultimasVendas.map((v) => (
                  <tr key={v.id}>
                    <td style={ui.td}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={ui.td}>{new Date(v.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...ui.td, fontWeight: 600 }}>{v.cliente_nome}</td>
                    <td style={{ ...ui.td, whiteSpace: 'normal', maxWidth: 220 }}>
                      {(v.venda_itens || []).map((i) => `${i.quantidade}x ${i.nome_produto}`).join(', ')}
                    </td>
                    <td style={ui.td}>{brl(v.total)}</td>
                    <td style={ui.td}>{v.pagamento}</td>
                    <td style={ui.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button title="Visualizar comprovante" onClick={() => setRecibo({ ...v, itens: v.venda_itens })} style={ui.iconBtn}>👁</button>
                        <button title="Imprimir comprovante" onClick={() => imprimirRecibo(v, v.venda_itens)} style={ui.iconBtn}>▤</button>
                        <button title="Excluir venda" onClick={() => setModalExcluirVenda(v)} style={{ ...ui.iconBtn, color: '#A85252' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL ABRIR CAIXA */}
      {modalAbrirCaixa && (
        <div style={ui.overlay} onClick={() => setModalAbrirCaixa(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={abrirCaixa} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Abrir caixa<button type="button" onClick={() => setModalAbrirCaixa(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <label style={ui.label}>Valor inicial em caixa (R$)</label>
              <input type="number" value={valorInicialCaixa} onChange={(e) => setValorInicialCaixa(e.target.value)} style={ui.input} placeholder="0,00" />
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalAbrirCaixa(false)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" style={ui.btnGold}>Abrir caixa</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SANGRIA */}
      {modalSangria && (
        <div style={ui.overlay} onClick={() => setModalSangria(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={registrarSangria} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Registrar sangria<button type="button" onClick={() => setModalSangria(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={ui.field}>
                <label style={ui.label}>Valor (R$)</label>
                <input type="number" value={sangriaValor} onChange={(e) => setSangriaValor(e.target.value)} style={ui.input} />
              </div>
              <div style={ui.field}>
                <label style={ui.label}>Motivo</label>
                <input value={sangriaMotivo} onChange={(e) => setSangriaMotivo(e.target.value)} style={ui.input} />
              </div>
            </div>
            <div style={ui.modalFoot}>
              <button type="button" onClick={() => setModalSangria(false)} style={ui.btnGhost}>Cancelar</button>
              <button type="submit" style={ui.btnGold}>Registrar sangria</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL FECHAR CAIXA */}
      {modalFechar && (
        <div style={ui.overlay} onClick={() => setModalFechar(false)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Fechar caixa<button onClick={() => setModalFechar(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>Tem certeza que deseja fechar o caixa?</div>
            <div style={ui.modalFoot}>
              <button onClick={() => setModalFechar(false)} style={ui.btnGhost}>Cancelar</button>
              <button onClick={confirmarFecharCaixa} style={ui.btnDanger}>Confirmar fechamento</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR VENDA */}
      {modalExcluirVenda && (
        <div style={ui.overlay} onClick={() => setModalExcluirVenda(null)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Excluir venda<button onClick={() => setModalExcluirVenda(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              Tem certeza que deseja excluir a venda de <b>{modalExcluirVenda.cliente_nome}</b> no valor de <b>{brl(modalExcluirVenda.total)}</b>?
              <br /><br />
              <span style={{ fontSize: 12, color: '#9C9184' }}>
                Essa ação não pode ser desfeita. O estoque dos produtos dessa venda será devolvido automaticamente.
              </span>
            </div>
            <div style={ui.modalFoot}>
              <button onClick={() => setModalExcluirVenda(null)} style={ui.btnGhost}>Cancelar</button>
              <button onClick={confirmarExcluirVenda} disabled={excluindoVenda} style={ui.btnDanger}>{excluindoVenda ? 'Excluindo...' : 'Excluir venda'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR VENDA */}
      {modalConfirmar && (
        <div style={ui.overlay} onClick={() => !processando && setModalConfirmar(false)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Finalizar venda<button onClick={() => setModalConfirmar(false)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}><span>Cliente</span><span>{clienteNome || 'Não identificado'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}><span>Pagamento</span><span>{pagamento}{pagamento === 'Crédito' && parcelas > 1 ? ` em ${parcelas}x` : ''}</span></div>
              {pagamento === 'Promissória' && (() => {
                const entrada = Math.min(parseFloat(valorEntrada) || 0, total);
                const financiado = Math.max(total - entrada, 0);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}><span>Entrada (paga agora)</span><span>{brl(entrada)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#A85252' }}><span>Fica na promissória</span><span>{brl(financiado)}</span></div>
                  </>
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 800, marginTop: 8 }}><span>Total a pagar</span><span>{brl(total)}</span></div>
            </div>
            <div style={ui.modalFoot}>
              <button onClick={() => setModalConfirmar(false)} style={ui.btnGhost}>Voltar</button>
              <button onClick={finalizarVenda} disabled={processando} style={ui.btnGold}>{processando ? 'Processando...' : 'Confirmar venda'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPROVANTE (visualizar / pós-venda) */}
      {recibo && (
        <div style={ui.overlay} onClick={() => setRecibo(null)}>
          <div onClick={(e) => e.stopPropagation()} style={ui.modalNarrow}>
            <div style={ui.modalHead}>Comprovante<button onClick={() => setRecibo(null)} style={ui.closeBtn}>✕</button></div>
            <div style={ui.modalBody}>
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15, marginBottom: 2 }}>MASTER JOIAS</div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#9C9184', marginBottom: 10 }}>
                {new Date(recibo.criado_em || Date.now()).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: 12.5 }}>Cliente: {recibo.cliente_nome}</div>
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>
                Pagamento: {recibo.pagamento}
                {recibo.parcelas > 1 ? ` (${recibo.parcelas}x de ${brl(recibo.total / recibo.parcelas)})` : ''}
                {recibo.pagamento === 'Promissória' && recibo.valor_promissoria > 0 ? ` — entrada de ${brl(recibo.valor_entrada)}, restante de ${brl(recibo.valor_promissoria)} em promissória` : ''}
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #E7E2D9', margin: '8px 0' }} />
              {(recibo.itens || []).map((i, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
                  <span>{i.qty || i.quantidade}x {i.nome || i.nome_produto}</span>
                  <span>{brl((i.preco || i.preco_unitario) * (i.qty || i.quantidade))}</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px dashed #E7E2D9', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Subtotal</span><span>{brl(recibo.subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Desconto</span><span>- {brl(recibo.desconto)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Acréscimo</span><span>+ {brl(recibo.acrescimo)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, marginTop: 6 }}><span>Total</span><span>{brl(recibo.total)}</span></div>
            </div>
            <div style={ui.modalFoot}>
              <button onClick={() => setRecibo(null)} style={ui.btnGhost}>Fechar</button>
              <button onClick={() => imprimirRecibo(recibo, recibo.itens)} style={ui.btnGold}>Imprimir comprovante</button>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO */}
      <div id="print-area" ref={printAreaRef}></div>
    </div>
  );
}