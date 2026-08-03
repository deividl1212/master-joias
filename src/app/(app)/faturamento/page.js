export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import FaturamentoClient from '@/components/faturamento/FaturamentoClient';

function inicioFimHoje() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1, 0, 0, 0);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

export default async function FaturamentoPage() {
  const supabase = createClient();
  const { inicio, fim } = inicioFimHoje();

  const [{ data: vendas }, { data: recebimentos }, { data: sangrias }] = await Promise.all([
    supabase.from('vendas').select('*').gte('criado_em', inicio).lt('criado_em', fim).order('criado_em', { ascending: false }),
    supabase.from('promissoria_recebimentos').select('*, promissorias(cliente_nome)').gte('criado_em', inicio).lt('criado_em', fim).order('criado_em', { ascending: false }),
    supabase.from('caixa_sangrias').select('valor').gte('criado_em', inicio).lt('criado_em', fim),
  ]);

  return (
    <AppShell title="Faturamento do Dia" subtitle="Movimentações de hoje">
      <FaturamentoClient
        vendasIniciais={vendas || []}
        recebimentosIniciais={recebimentos || []}
        sangriasHoje={(sangrias || []).reduce((s, x) => s + x.valor, 0)}
      />
    </AppShell>
  );
}