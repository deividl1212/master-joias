import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import FaturamentoClient from '@/components/faturamento/FaturamentoClient';

export default async function FaturamentoPage() {
  const supabase = createClient();
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const [{ data: vendasHoje }, { data: sangriasHoje }] = await Promise.all([
    supabase.from('vendas').select('*').gte('criado_em', inicioDia.toISOString()).order('criado_em', { ascending: false }),
    supabase.from('caixa_sangrias').select('valor').gte('criado_em', inicioDia.toISOString()),
  ]);

  return (
    <AppShell title="Faturamento do Dia" subtitle="Movimentações de hoje">
      <FaturamentoClient vendasHoje={vendasHoje || []} sangriasHoje={sangriasHoje || []} />
    </AppShell>
  );
}
