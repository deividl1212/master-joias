import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import ContasClient from '@/components/contas/ContasClient';

export default async function ContasPage() {
  const supabase = createClient();
  const [{ data: contas, error }, { data: fornecedores }] = await Promise.all([
    supabase.from('contas_pagar').select('*, fornecedores(fantasia)').order('criado_em', { ascending: false }),
    supabase.from('fornecedores').select('id, fantasia').order('fantasia'),
  ]);

  return (
    <AppShell title="Contas a Pagar" subtitle="Obrigações financeiras da loja">
      <ContasClient contasIniciais={contas || []} fornecedores={fornecedores || []} erroCarregamento={error?.message} />
    </AppShell>
  );
}
