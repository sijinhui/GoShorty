import { useState } from 'react';
import type { FormEvent } from 'react';
import { createLink } from '../../api/links';
import type { CreateLinkRequest } from '../../types/api';

interface CreateLinkFormProps {
  onSuccess?: () => void;
}

export default function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const [formData, setFormData] = useState<CreateLinkRequest>({
    original_url: '',
    short_code: '',
    title: '',
    expires_at: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await createLink(formData);
      setSuccess(`短链接创建成功！${response.data?.short_url || ''}`);
      setFormData({
        original_url: '',
        short_code: '',
        title: '',
        expires_at: '',
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.error || '创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
      }}>
        快速创建短链接
      </h2>

      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#efe',
          color: '#3c3',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
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
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: isLoading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '创建中...' : '创建短链接'}
        </button>
      </form>
    </div>
  );
}
