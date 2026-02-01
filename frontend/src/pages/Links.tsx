import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinks, deleteLink } from '../api/links';
import { getExpiredLinks } from '../api/linkExpiry';
import LinkTable from '../components/links/LinkTable';

export default function Links() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['links', page],
    queryFn: () => getLinks(page, 20),
  });

  // 获取所有有过期设置的链接
  const { data: expiryData } = useQuery({
    queryKey: ['all-expiry-links'],
    queryFn: () => getExpiredLinks(10000, 0), // 获取所有
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      alert('删除失败');
    }
  };

  // 创建短码集合，用于快速查找
  const expiryShortCodes = new Set(
    expiryData?.data?.expiries?.map(e => e.short_code) || []
  );

  if (isLoading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>加载中...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(184, 122, 122, 0.15)',
        color: 'var(--error)',
        padding: '1rem',
        borderRadius: '10px',
        border: '1px solid var(--error)',
        fontFamily: 'var(--font-body)',
      }}>
        加载失败：{(error as any).error || '未知错误'}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: '800',
        fontFamily: 'var(--font-heading)',
        marginBottom: '2rem',
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        链接管理
      </h1>

      {data && (
        <LinkTable
          links={data.data}
          pagination={data.pagination}
          onPageChange={setPage}
          onDelete={handleDelete}
          expiryShortCodes={expiryShortCodes}
        />
      )}
    </div>
  );
}
