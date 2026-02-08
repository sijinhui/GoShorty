import { useState } from 'react';
import type { FormEvent } from 'react';
import { createLink } from '../../api/links';
import type { CreateLinkRequest } from '../../types/api';
import CopyButton from '../common/CopyButton';

interface CreateLinkFormProps {
  onSuccess?: () => void;
}

export default function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const [formData, setFormData] = useState<CreateLinkRequest>({
    original_url: '',
    short_code: '',
    title: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setShortUrl(null);

    try {
      const response = await createLink(formData);
      const url = response.data?.short_url || '';
      setShortUrl(url);
      setSuccess('短链接创建成功！');
      setFormData({
        original_url: '',
        short_code: '',
        title: '',
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.error || '创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      padding: '1.75rem',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-subtle)',
      animation: 'fadeIn 0.5s ease-out 0.2s backwards',
    }}>
      <h2 style={{
        fontSize: '1.375rem',
        fontWeight: '800',
        fontFamily: 'var(--font-heading)',
        marginBottom: '1.5rem',
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}>
        快速创建短链接
      </h2>

      {error && (
        <div style={{
          background: 'rgba(184, 122, 122, 0.15)',
          color: 'var(--error)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          border: '1px solid var(--error)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {error}
        </div>
      )}

      {success && shortUrl && (
        <div style={{
          background: 'rgba(107, 142, 127, 0.15)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          border: '1px solid var(--success)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>{success}</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--bg-elevated)',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}>
            <code style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
            }}>
              {shortUrl}
            </code>
            <CopyButton
              text={shortUrl}
              successMessage="短链接已复制到剪贴板"
              variant="secondary"
              useMessage={true}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.625rem',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            letterSpacing: '0.01em',
          }}>
            原始链接 *
          </label>
          <input
            type="url"
            value={formData.original_url}
            onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
            required
            placeholder="https://example.com"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.625rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              letterSpacing: '0.01em',
            }}>
              自定义短码（可选）
            </label>
            <input
              type="text"
              value={formData.short_code}
              onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
              placeholder="abc123"
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

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.625rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              letterSpacing: '0.01em',
            }}>
              标题（可选）
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="链接标题"
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '0.875rem 1.75rem',
            background: isLoading ? 'var(--gray-700)' : 'var(--accent-primary)',
            color: isLoading ? 'var(--text-tertiary)' : '#ffffff',
            border: '1px solid',
            borderColor: isLoading ? 'var(--border-subtle)' : 'var(--accent-primary)',
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
          {isLoading ? '创建中...' : '创建短链接'}
        </button>
      </form>
    </div>
  );
}
