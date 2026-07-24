'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

// Domínio interno usado só para satisfazer o formato de email exigido
// pelo Supabase Auth. A loja nunca vê nem digita isso.
const DOMINIO_INTERNO = 'masterjoias.local';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const usuarioNormalizado = usuario.trim().toLowerCase().replace(/\s+/g, '');
    const emailInterno = `${usuarioNormalizado}@${DOMINIO_INTERNO}`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInterno,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro('Usuário ou senha incorretos. Tente novamente.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.glow} />
        <div style={styles.logoWrap}>
          <Image src="/logo-master-joias.jpg" alt="Master Joias" width={92} height={92} style={{ objectFit: 'contain' }} priority />
        </div>
        <div style={styles.subtitle}>Acesse o sistema de gestão</div>

        <form onSubmit={handleLogin} style={{ marginTop: 28 }}>
          <label style={styles.label}>Usuário</label>
          <input
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={styles.input}
            placeholder="masterjoias"
          />

          <label style={styles.label}>Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
          />

          {erro && <div style={styles.erro}>{erro}</div>}

          <button type="submit" disabled={carregando} style={styles.button}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 0%, #F4EAD9 0%, #FAF8F5 55%)',
  },
  card: {
    position: 'relative',
    width: 380,
    maxWidth: '90vw',
    background: '#FFFFFF',
    border: '1px solid #E7E2D9',
    borderRadius: 20,
    padding: '40px 32px 36px',
    boxShadow: '0 20px 50px rgba(27,26,24,.14)',
    textAlign: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
    width: 260, height: 160, background: 'radial-gradient(closest-side, rgba(184,147,90,.25), transparent)',
    pointerEvents: 'none',
  },
  logoWrap: {
    position: 'relative',
    width: 108,
    height: 108,
    borderRadius: '50%',
    background: '#fff',
    border: '1px solid #E7E2D9',
    boxShadow: '0 0 0 6px #FAF3E7, 0 8px 24px rgba(184,147,90,.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#726A5D',
    marginTop: 2,
    letterSpacing: .3,
  },
  label: {
    display: 'block',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#4B453C',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 9,
    border: '1px solid #D6CFC2',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  },
  erro: {
    marginTop: 14,
    fontSize: 12.5,
    color: '#A85252',
    background: '#F7EBEB',
    padding: '8px 12px',
    borderRadius: 8,
    textAlign: 'left',
  },
  button: {
    width: '100%',
    marginTop: 22,
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B8935A, #8F6E3E)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
};
