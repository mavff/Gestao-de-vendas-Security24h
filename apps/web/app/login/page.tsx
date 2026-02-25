'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { getFallbackRouteForRole } from '../../src/config/rbac';

const gold = '#C8A951';
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
  const usernameRef = useRef<HTMLInputElement>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar. Verifique a rede.');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return null;

  return (
    <>
      {/* Estilos para mobile */}
      <style>{`
        @media (max-width: 767px) {
          .login-right { display: none !important; }
          .login-left { flex: 1 !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── ESQUERDA — Formulário ── */}
        <div
          className="login-left"
          style={{
            flex: '0 0 420px',
            background: '#0B0B0B',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 48px',
            position: 'relative',
            zIndex: 1,
            boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Reflexo dourado sutil */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,81,0.10) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'grid', gap: 28 }}>

            {/* Logo */}
            <div style={{ textAlign: 'center' }}>
              <img
                src="/LOGO SECURITY 24H.png"
                alt="Security24h"
                style={{
                  maxHeight: 90,
                  maxWidth: 240,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 16px rgba(200,169,81,0.35))',
                }}
              />
            </div>

            {/* Card glassmorphism */}
            <form
              onSubmit={handleSubmit}
              style={{
                background: 'rgba(20, 20, 20, 0.85)',
                border: `1px solid rgba(200,169,81,0.20)`,
                borderRadius: 20,
                padding: '32px 28px',
                display: 'grid',
                gap: 18,
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,169,81,0.07)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Subtítulo */}
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 13, color: `${muted}CC`, letterSpacing: 0.3 }}>
                  Acesse com seu usuário do sistema
                </p>
              </div>

              {/* Campo usuário */}
              <div style={{ display: 'grid', gap: 7 }}>
                <label style={{ fontSize: 11, color: `${gold}CC`, fontWeight: 700, letterSpacing: 0.8 }}>
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
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: text,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${gold}88`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = border; }}
                />
              </div>

              {/* Campo senha */}
              <div style={{ display: 'grid', gap: 7 }}>
                <label style={{ fontSize: 11, color: `${gold}CC`, fontWeight: 700, letterSpacing: 0.8 }}>
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
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      padding: '11px 44px 11px 14px',
                      fontSize: 14,
                      color: text,
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = `${gold}88`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = border; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: muted,
                      fontSize: 11,
                      padding: 0,
                      letterSpacing: 0.2,
                    }}
                  >
                    {showPassword ? 'ocultar' : 'ver'}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div style={{
                  background: `${danger}15`,
                  border: `1px solid ${danger}44`,
                  borderRadius: 10,
                  padding: '9px 13px',
                  fontSize: 13,
                  color: danger,
                }}>
                  {error}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading
                    ? 'rgba(200,169,81,0.35)'
                    : 'linear-gradient(135deg, #C8A951, #a8892f)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 800,
                  color: loading ? muted : '#0B0B0B',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: 0.6,
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(200,169,81,0.3)',
                  transition: 'all 200ms ease',
                  marginTop: 4,
                }}
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            {/* Rodapé */}
            <p style={{ textAlign: 'center', fontSize: 11, color: `${muted}55`, margin: 0 }}>
              Use o mesmo usuário e senha do Service
            </p>
          </div>
        </div>

        {/* ── DIREITA — Imagem ── */}
        <div
          className="login-right"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src="/pessoas_empresa.png"
            alt="Security24h"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
          {/* Overlay gradiente para fundir com o painel esquerdo */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(11,11,11,0.55) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.10) 100%)',
          }} />
          {/* Texto de marca no canto inferior */}
          <div style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
          }}>
            <p style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#FFFFFF',
              textShadow: '0 2px 16px rgba(0,0,0,0.7)',
              lineHeight: 1.25,
            }}>
              Segurança e tecnologia<br />
              <span style={{ color: gold }}>para quem não para.</span>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
