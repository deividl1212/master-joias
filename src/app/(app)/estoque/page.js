import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import EstoqueClient from '@/components/estoque/EstoqueClient';

export default async function EstoquePage() {
  const supabase = createClient();
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .order('criado_em', { ascending: false });

  return (
    <AppShell title="Estoque" subtitle="Catálogo e níveis de estoque">
      <EstoqueClient produtosIniciais={produtos || []} erroCarregamento={error?.message} />
    </AppShell>
  );
}
