'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { getFallbackRouteForRole } from '../../src/config/rbac';

const gold = '#C8A951';
const bg = '#0B0B0B';
const panel = '#141414';
const soft = '#1D1D1D';
const border = '#3A3A3A';
const muted = '#B5B5B5';
const danger = '#E55B5B';
const text = '#F2F2F2';

export default function LoginPage() {
  const { login, isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Já autenticado → redireciona
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getFallbackRouteForRole(role));
    }
  }, [isLoading, isAuthenticated, role, router]);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Informe usuário e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // AuthContext atualiza → useEffect acima redireciona
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar. Verifique a rede.');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundImage: 'radial-gradient(ellipse at 70% 20%, rgba(200,169,81,0.07) 0%, transparent 60%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        display: 'grid',
        gap: 24,
      }}>
        {/* Logo / Marca */}
        <div style={{ textAlign: 'center' }}>
          {!logoError ? (
            <img
              src="/logo.png"
              alt="Logo"
              onError={() => setLogoError(true)}
              style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain', marginBottom: 8 }}
            />
          ) : (
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: 26,
                fontWeight: 800,
                color: gold,
                letterSpacing: 0.5,
              }}>Security24h</span>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13, color: muted }}>
            Acesse com seu usuário do sistema
          </p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: panel,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: '28px 24px',
            display: 'grid',
            gap: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Campo usuário */}
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: muted, fontWeight: 600, letterSpacing: 0.3 }}>
              USUÁRIO
            </label>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              placeholder="seu.usuario"
              style={{
                background: soft,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: text,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Campo senha */}
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: muted, fontWeight: 600, letterSpacing: 0.3 }}>
              SENHA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••"
                style={{
                  background: soft,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: '10px 40px 10px 12px',
                  fontSize: 14,
                  color: text,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: muted,
                  fontSize: 11,
                  padding: 0,
                }}
              >
                {showPassword ? 'ocultar' : 'ver'}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div style={{
              background: `${danger}18`,
              border: `1px solid ${danger}55`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              color: danger,
            }}>
              {error}
            </div>
          )}

          {/* Botão entrar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? `${gold}55` : gold,
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 14,
              fontWeight: 700,
              color: loading ? muted : '#0B0B0B',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5,
              transition: 'background 200ms ease',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {/* Rodapé */}
        <p style={{ textAlign: 'center', fontSize: 11, color: `${muted}88`, margin: 0 }}>
          Use o mesmo usuário e senha do Service
        </p>
      </div>
    </div>
  );
}
