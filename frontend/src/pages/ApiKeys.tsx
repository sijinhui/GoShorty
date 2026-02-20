import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateApiKey, listApiKeys, revokeApiKey, deleteApiKey } from '../api/apiKeys';
import { useResponsive } from '../hooks/useResponsive';
import type { ApiKey } from '../types/api';

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: listApiKeys,
  });

  const generateMutation = useMutation({
    mutationFn: (name: string) => generateApiKey(name),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setGeneratedKey(res.data?.key || null);
      setNewKeyName('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    if (!newKeyName.trim()) {
      setNameError('请输入密钥名称');
      return;
    }
    setGeneratedKey(null);
    generateMutation.mutate(newKeyName.trim());
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'rgba(184, 122, 122, 0.15)', color: 'var(--error)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--error)', fontFamily: 'var(--font-body)' }}>
        加载失败：{(error as any)?.error || '未知错误'}
      </div>
    );
  }

  const keys: ApiKey[] = data?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-heading)', marginBottom: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', animation: 'fadeIn 0.5s ease-out' }}>
        API 密钥管理
      </h1>

      {/* 生成新密钥 */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: isMobile ? '1.25rem' : '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.5s ease-out' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          生成新密钥
        </h2>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => { setNewKeyName(e.target.value); setNameError(''); }}
            placeholder="密钥名称（如：CI/CD、脚本调用）"
            style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none', transition: 'border-color var(--transition-fast)' }}
          />
          <button
            type="submit"
            disabled={generateMutation.isPending}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: '600', cursor: generateMutation.isPending ? 'not-allowed' : 'pointer', opacity: generateMutation.isPending ? 0.5 : 1, transition: 'opacity var(--transition-fast)', whiteSpace: 'nowrap' }}
          >
            {generateMutation.isPending ? '生成中...' : '生成密钥'}
          </button>
        </form>

        {nameError && (
          <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}>
            {nameError}
          </div>
        )}

        {generateMutation.isError && (
          <div style={{ marginTop: '0.75rem', background: 'rgba(184, 122, 122, 0.15)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--error)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
            生成失败：{(generateMutation.error as any)?.error || '未知错误'}
          </div>
        )}
      </div>

      {/* 新生成的密钥展示 */}
      {generatedKey && (
        <div style={{ background: 'rgba(107, 142, 127, 0.12)', borderRadius: '12px', padding: isMobile ? '1.25rem' : '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--success)', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1rem' }}>🔑</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>密钥已生成</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            请立即复制并妥善保存，此密钥不会再次显示。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <code style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)', wordBreak: 'break-all', width: isMobile ? '100%' : 'auto' }}>
              {generatedKey}
            </code>
            <button
              onClick={handleCopy}
              style={{ padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: copied ? 'var(--success)' : 'var(--bg-elevated)', color: copied ? '#fff' : 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all var(--transition-fast)', whiteSpace: 'nowrap' }}
            >
              {copied ? '已复制 ✓' : '复制'}
            </button>
          </div>
        </div>
      )}

      {/* 密钥列表 */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: isMobile ? '1.25rem' : '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.6s ease-out' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          已有密钥
        </h2>

        {keys.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            暂无 API 密钥，点击上方按钮生成一个。
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {keys.map((key) => (
              <div key={key.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', transition: 'border-color var(--transition-fast)', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0.75rem' : '0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{key.name}</span>
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', background: key.is_active ? 'rgba(107, 142, 127, 0.15)' : 'rgba(184, 122, 122, 0.15)', color: key.is_active ? 'var(--success)' : 'var(--error)' }}>
                      {key.is_active ? '活跃' : '已吊销'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{key.key_prefix}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', marginTop: '0.25rem' }}>
                    创建于 {new Date(key.created_at).toLocaleDateString('zh-CN')}
                    {key.last_used_at && ` · 最后使用 ${new Date(key.last_used_at).toLocaleDateString('zh-CN')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {key.is_active && (
                    <button
                      onClick={() => { if (confirm('确定要吊销此密钥？吊销后使用该密钥的请求将被拒绝。')) revokeMutation.mutate(key.id); }}
                      disabled={revokeMutation.isPending}
                      style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--warning)', background: 'transparent', color: 'var(--warning)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
                    >
                      吊销
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('确定要删除此密钥？此操作不可恢复。')) deleteMutation.mutate(key.id); }}
                    disabled={deleteMutation.isPending}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API 使用说明 */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: isMobile ? '1.25rem' : '1.5rem', marginTop: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.7s ease-out' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          API 使用说明
        </h2>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '0.75rem' }}>通过 <code style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--bg-hover)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>POST /api/v1/shorten</code> 创建短链接，支持两种模式：</p>

          <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem', marginTop: '1rem' }}>访客模式（无需认证）</h3>
          <pre style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)', overflowX: 'auto', lineHeight: '1.6' }}>{`curl -X POST ${window.location.origin}/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}</pre>

          <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '0.5rem', marginTop: '1rem' }}>管理员模式（需要 API Key）</h3>
          <pre style={{ padding: '0.875rem', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)', overflowX: 'auto', lineHeight: '1.6' }}>{`curl -X POST ${window.location.origin}/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gs-your-key-here" \\
  -d '{"url": "https://example.com", "custom_code": "mylink", "title": "My Link", "expiry_days": 30}'`}</pre>

          <p style={{ marginTop: '1rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            管理员模式支持自定义短码、标题和过期天数。访客模式仅支持传入 URL。
          </p>
        </div>
      </div>
    </div>
  );
}