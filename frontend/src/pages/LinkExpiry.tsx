import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpiredLinks, deleteExpiredLink, deleteAllExpiredLinks } from '../api/linkExpiry';
import type { LinkExpiry } from '../api/linkExpiry';

export default function LinkExpiryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, isLoading, error } = useQuery({
    queryKey: ['expired-links', page],
    queryFn: () => getExpiredLinks(limit, offset),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpiredLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expired-links'] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllExpiredLinks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expired-links'] });
    },
  });

  const handleDelete = async (shortCode: string) => {
    if (!confirm(`确定要删除过期记录 ${shortCode} 吗？`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(shortCode);
      alert('删除成功');
    } catch (error: any) {
      alert(error?.error || '删除失败');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('确定要删除所有已过期的记录吗？此操作不可撤销！')) {
      return;
    }
    try {
      const result = await deleteAllMutation.mutateAsync();
      alert(`成功删除 ${result.data?.deleted_count || 0} 条过期记录`);
    } catch (error: any) {
      alert(error?.error || '批量删除失败');
    }
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

  const expiries = data?.data?.expiries || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
        }}>
          链接过期管理
        </h1>
        {total > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {deleteAllMutation.isPending ? '删除中...' : `批量删除全部 (${total})`}
          </button>
        )}
      </div>

      {expiries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280',
        }}>
          暂无过期链接
        </div>
      ) : (
        <>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>短码</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>状态</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {expiries.map((expiry: LinkExpiry) => {
                  const isExpired = new Date(expiry.expires_at) < new Date();
                  const timeRemaining = new Date(expiry.expires_at).getTime() - new Date().getTime();
                  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                  return (
                    <tr key={expiry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {expiry.short_code}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {isExpired ? (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            已过期
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dbeafe',
                            color: '#2563eb',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            {daysRemaining > 0
                              ? `剩余${daysRemaining}天${hoursRemaining}小时`
                              : hoursRemaining > 0
                                ? `剩余${hoursRemaining}小时`
                                : '即将过期'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(expiry.short_code)}
                          disabled={deleteMutation.isPending}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: page === 1 ? '#e5e7eb' : '#3b82f6',
                  color: page === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: page === totalPages ? '#e5e7eb' : '#3b82f6',
                  color: page === totalPages ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
