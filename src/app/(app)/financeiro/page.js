import AppShell from '@/components/AppShell';
import FinanceiroClient from '@/components/financeiro/FinanceiroClient';

export default function FinanceiroPage() {
  return (
    <AppShell title="Financeiro" subtitle="Visão financeira por mês">
      <FinanceiroClient />
    </AppShell>
  );
}
