export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import AppShell from '@/components/AppShell';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const nomeUsuario = user?.email?.split('@')[0] || 'usuário';

  return (
    <AppShell title="Faturamento Mensal" subtitle="Visão geral do mês">
      <DashboardClient nomeUsuario={nomeUsuario} />
    </AppShell>
  );
}