import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';

export default function Settings() {
  const queryClient = useQueryClient();
  const [shortCodeLength, setShortCodeLength] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  // 当数据加载完成后，更新状态
  useEffect(() => {
    if (data?.data) {
      setShortCodeLength(data.data.short_code_length);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('设置已更新');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (shortCodeLength < 3 || shortCodeLength > 20) {
      return;
    }

    mutation.mutate({ short_code_length: shortCodeLength });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fee',
        color: '#c33',
        padding: '1rem',
        borderRadius: '4px',
      }}>
        加载失败：{(error as any).error || '未知错误'}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
      }}>
        系统设置
      </h1>

      {successMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {successMessage}
        </div>
      )}

      {mutation.isError && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          更新失败：{(mutation.error as any)?.error || '未知错误'}
        </div>
      )}

      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
        }}>
          短链接设置
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
            }}>
              短链接长度
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={shortCodeLength}
              onChange={(e) => setShortCodeLength(parseInt(e.target.value) || 3)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <p style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#666',
            }}>
              设置短链接代码的长度（3-20位）。当前设置：{shortCodeLength}位
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20}
            style={{
              background: mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20 ? '#ccc' : '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {mutation.isPending ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>
    </div>
  );
}
