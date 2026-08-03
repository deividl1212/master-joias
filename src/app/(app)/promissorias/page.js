export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import PromissoriasClient from '@/components/promissorias/PromissoriasClient';

export default async function PromissoriasPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('promissorias')
    .select('*')
    .order('criado_em', { ascending: false });

  const ordenado = (data || []).sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'Pendente' ? -1 : 1;
  });

  return (
    <AppShell title="Promissórias" subtitle="Controle de saldo devedor dos clientes">
      <PromissoriasClient promissoriasIniciais={ordenado} erroCarregamento={error?.message} />
    </AppShell>
  );
}