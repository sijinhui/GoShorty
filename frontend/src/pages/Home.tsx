import { useState } from 'react';
import type { FormEvent } from 'react';
import { createPublicLink } from '../api/public';

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: 'white',
        borderRadius: '12px',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        {/* 标题 */}
        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#1f2937',
          lineHeight: '1.4',
        }}>
          通过一个短链接快速访问您的网站
        </h1>

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
                padding: '0.875rem',
                fontSize: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white',
                background: loading ? '#9ca3af' : '#667eea',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#5568d3';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#667eea';
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
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
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
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: '500',
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
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    outline: 'none',
                    background: 'white',
                  }}
                />
              </div>
            </div>
          )}
        </form>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '0.875rem',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            marginTop: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#166534',
              marginBottom: '0.75rem',
              fontWeight: '600',
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
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {result.short_url}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.short_url);
                  alert('已复制到剪贴板！');
                }}
                style={{
                  padding: '0.75rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
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
