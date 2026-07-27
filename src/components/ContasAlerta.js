'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { brl } from '@/lib/uiStyles';

export default function ContasAlerta() {
  const supabase = createClient();
  const [contasUrgentes, setContasUrgentes] = useState([]);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    async function verificar() {
      const daqui5dias = new Date();
      daqui5dias.setDate(daqui5dias.getDate() + 5);
      const { data } = await supabase
        .from('contas_pagar')
        .select('*, fornecedores(fantasia)')
        .neq('status', 'Pago')
        .not('data_vencimento', 'is', null)
        .lte('data_vencimento', daqui5dias.toISOString().slice(0, 10));
      setContasUrgentes(data || []);
    }
    verificar();
  }, [supabase]);

  if (fechado || contasUrgentes.length === 0) return null;

  const totalUrgente = contasUrgentes.reduce((s, c) => s + c.valor, 0);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.head}>
          <span>⚠️ Contas a pagar vencendo</span>
          <button onClick={() => setFechado(true)} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.body}>
          {contasUrgentes.length} conta(s), totalizando <b>{brl(totalUrgente)}</b>, está(ão)
          vencida(s) ou vence(m) nos próximos 5 dias.
        </div>
        <Link href="/contas" style={styles.link}>Ver contas a pagar →</Link>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', top: 20, right: 20, zIndex: 850, maxWidth: 300 },
  card: { background: '#fff', border: '1.5px solid #A85252', borderRadius: 12, boxShadow: '0 12px 32px rgba(27,26,24,.16)', overflow: 'hidden' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#F7EBEB', color: '#A85252', padding: '10px 14px', fontWeight: 700, fontSize: 12.5,
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#A85252', fontSize: 13 },
  body: { padding: '12px 14px', fontSize: 12.5, color: '#4B453C', lineHeight: 1.5 },
  link: { display: 'block', padding: '0 14px 14px', fontSize: 12.5, fontWeight: 700, color: '#8F6E3E', textDecoration: 'none' },
};