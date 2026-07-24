import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import FornecedoresClient from '@/components/fornecedores/FornecedoresClient';

export default async function FornecedoresPage() {
  const supabase = createClient();
  const { data: fornecedores, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('criado_em', { ascending: false });

  return (
    <AppShell title="Fornecedores" subtitle="Parceiros e fornecedores da loja">
      <FornecedoresClient fornecedoresIniciais={fornecedores || []} erroCarregamento={error?.message} />
    </AppShell>
  );
}
