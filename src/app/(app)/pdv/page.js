import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import PdvClient from '@/components/pdv/PdvClient';

export default async function PdvPage() {
  const supabase = createClient();
  const [{ data: produtos }, { data: clientes }, { data: caixaAberto }, { data: ultimasVendas }] = await Promise.all([
    supabase.from('produtos').select('*').order('nome'),
    supabase.from('clientes').select('id, nome, total_gasto').order('nome'),
    supabase.from('caixa').select('*').eq('aberto', true).maybeSingle(),
    supabase.from('vendas').select('*, venda_itens(*)').order('criado_em', { ascending: false }).limit(8),
  ]);

  return (
    <AppShell title="PDV / Vendas" subtitle="Área de vendas">
      <PdvClient
        produtosIniciais={produtos || []}
        clientesIniciais={clientes || []}
        caixaInicial={caixaAberto || null}
        ultimasVendasIniciais={ultimasVendas || []}
      />
    </AppShell>
  );
}
