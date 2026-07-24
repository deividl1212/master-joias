import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import ClientesClient from '@/components/clientes/ClientesClient';

export default async function ClientesPage() {
  const supabase = createClient();
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false });

  return (
    <AppShell title="Clientes" subtitle="Relacionamento e histórico de compras">
      <ClientesClient clientesIniciais={clientes || []} erroCarregamento={error?.message} />
    </AppShell>
  );
}
