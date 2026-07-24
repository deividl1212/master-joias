import AppShell from '@/components/AppShell';
import RelatoriosClient from '@/components/relatorios/RelatoriosClient';

export default function RelatoriosPage() {
  return (
    <AppShell title="Relatórios" subtitle="Gere, filtre e exporte relatórios detalhados">
      <RelatoriosClient />
    </AppShell>
  );
}
