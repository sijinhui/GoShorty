import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated, checkAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 获取重定向路径，如果没有则默认为 /admin
  const getRedirectPath = () => {
    const redirect = searchParams.get('redirect');
    return redirect ? decodeURIComponent(redirect) : '/admin';
  };

  // 组件挂载时检查登录状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 如果用户已登录，显示提示并在2秒后跳转
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShowRedirectMessage(true);
      const timer = setTimeout(() => {
        navigate(getRedirectPath(), { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ username, password });
      navigate(getRedirectPath());
    } catch (err) {
      // 错误已经在store中处理
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--page-background)',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Theme toggle button */}
      <button
        onClick={(e) => toggleTheme(e)}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          width: '48px',
          height: '48px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-base)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Atmospheric geometric pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: theme === 'dark'
          ? `
            linear-gradient(var(--gray-800) 1px, transparent 1px),
            linear-gradient(90deg, var(--gray-800) 1px, transparent 1px)
          `
          : `
            linear-gradient(var(--gray-600) 1px, transparent 1px),
            linear-gradient(90deg, var(--gray-600) 1px, transparent 1px)
          `,
        backgroundSize: '50px 50px',
        opacity: theme === 'dark' ? 0.3 : 0.12,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-elevated)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 0.6s ease-out',
      }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          animation: 'fadeIn 0.8s ease-out 0.2s backwards',
        }}>
          GoShorty 登录
        </h1>

        {showRedirectMessage ? (
          <div style={{
            background: 'rgba(107, 142, 127, 0.15)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '1.25rem',
            borderRadius: '10px',
            textAlign: 'center',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <div style={{
              marginBottom: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
            }}>
              ✓ 您已登录
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              即将跳转到管理后台...
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '2px solid var(--border-subtle)',
                borderTopColor: 'var(--success)',
                borderRadius: '50%',
                animation: 'pulse 1s ease-in-out infinite',
              }}></div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: 'rgba(184, 122, 122, 0.15)',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                padding: '1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-body)',
                fontWeight: '500',
                animation: 'fadeIn 0.3s ease-out',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all var(--transition-base)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all var(--transition-base)',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: isLoading ? 'var(--gray-700)' : 'var(--accent-primary)',
              color: isLoading ? 'var(--text-tertiary)' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-base)',
              boxShadow: isLoading ? 'none' : 'var(--shadow-md)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'var(--accent-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
