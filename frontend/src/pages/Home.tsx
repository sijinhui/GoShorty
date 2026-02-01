import { useState } from 'react';
import type { FormEvent } from 'react';
import { createPublicLink } from '../api/public';
import { notification } from '../components/AntdStaticMethods';
import { useThemeStore } from '../store/themeStore';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    short_url: string;
    short_code: string;
  } | null>(null);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useThemeStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await createPublicLink({
        original_url: url,
        short_code: customCode || undefined,
      });

      if (data.success && data.data) {
        setResult({
          short_url: data.data.short_url,
          short_code: data.data.short_code,
        });
        setUrl('');
        setCustomCode('');

        // 显示过期提示
        notification.info({
          title: '链接创建成功',
          description: '该链接将在七天后过期',
          placement: 'topRight',
          duration: 4.5,
          showProgress: true,
        });
      } else {
        setError('创建短链接失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '创建短链接失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark'
        ? `
          radial-gradient(circle at 20% 30%, rgba(122, 138, 153, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(122, 138, 153, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, var(--gray-900) 0%, var(--gray-850) 50%, var(--gray-900) 100%)
        `
        : 'var(--gray-300)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
      {/* Atmospheric geometric pattern overlay - only in dark theme */}
      {theme === 'dark' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--gray-800) 1px, transparent 1px),
            linear-gradient(90deg, var(--gray-800) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: 'var(--bg-elevated)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 0.6s ease-out',
      }}>
        {/* 标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          animation: 'fadeIn 0.8s ease-out 0.2s backwards',
        }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            marginBottom: '0.75rem',
            color: 'var(--text-primary)',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
          }}>
            GoShorty
          </h1>
          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: 'var(--text-secondary)',
            fontWeight: '500',
            letterSpacing: '0.01em',
          }}>
            通过一个短链接快速访问您的网站
          </p>
        </div>

        {/* 主表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴网址, 缩短 & 分享"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                outline: 'none',
                transition: 'all var(--transition-base)',
                boxSizing: 'border-box',
                color: 'var(--text-primary)',
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
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'var(--font-body)',
                color: loading ? 'var(--text-tertiary)' : '#ffffff',
                background: loading ? 'var(--gray-700)' : 'var(--accent-primary)',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-base)',
                boxShadow: loading ? 'none' : 'var(--shadow-md)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
            >
              {loading ? '处理中...' : '缩短'}
            </button>
          </div>

          {/* 自定义选项按钮 */}
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowCustom(!showCustom)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                fontFamily: 'var(--font-body)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <path d="M13.5 3.5L11 1L8.5 3.5L11 6L13.5 3.5Z" />
                <path d="M8 8L5.5 5.5L3 8L5.5 10.5L8 8Z" />
                <path d="M13.5 12.5L11 10L8.5 12.5L11 15L13.5 12.5Z" />
                <path d="M3 3H7V4H3V3Z" />
                <path d="M9 12H13V13H9V12Z" />
              </svg>
              自定义 短网址
            </button>
          </div>

          {/* 自定义URL输入区 */}
          {showCustom && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              marginBottom: '1rem',
              border: '1px solid var(--border-subtle)',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                }}>
                  {window.location.host}/
                </span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="自定义短码"
                  disabled={loading}
                  pattern="[a-zA-Z0-9_-]*"
                  style={{
                    flex: '1 1 auto',
                    minWidth: '150px',
                    padding: '0.625rem',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    outline: 'none',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                />
              </div>
            </div>
          )}
        </form>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(184, 122, 122, 0.15)',
            color: 'var(--error)',
            borderRadius: '10px',
            marginTop: '1rem',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            border: '1px solid var(--error)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            {error}
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'rgba(107, 142, 127, 0.15)',
            border: '1px solid var(--success)',
            borderRadius: '10px',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--success)',
              marginBottom: '0.75rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
            }}>
              ✓ 短链接创建成功！
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <a
                href={result.short_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.875rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
              >
                {result.short_url}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.short_url);
                  notification.success({
                    title: '复制成功',
                    description: '短链接已复制到剪贴板',
                    placement: 'topRight',
                    duration: 3,
                    showProgress: true,
                  });
                }}
                style={{
                  padding: '0.875rem',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  transition: 'all var(--transition-base)',
                  boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                复制链接
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
