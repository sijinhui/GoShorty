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

  const expiries = data?.data?.expiries || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          链接过期管理
        </h1>
        {total > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--error)',
              color: 'var(--text-primary)',
              border: '1px solid var(--error)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-base)',
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
          background: 'var(--bg-elevated)',
          borderRadius: '12px',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          暂无过期链接
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{
                    padding: '1rem 0.875rem',
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>短码</th>
                  <th style={{
                    padding: '1rem 0.875rem',
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>状态</th>
                  <th style={{
                    padding: '1rem 0.875rem',
                    textAlign: 'right',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {expiries.map((expiry: LinkExpiry) => {
                  const isExpired = new Date(expiry.expires_at) < new Date();
                  const timeRemaining = new Date(expiry.expires_at).getTime() - new Date().getTime();
                  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                  return (
                    <tr key={expiry.id} style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{
                        padding: '0.875rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                      }}>
                        {expiry.short_code}
                      </td>
                      <td style={{ padding: '0.875rem', fontSize: '0.875rem' }}>
                        {isExpired ? (
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            background: 'rgba(184, 122, 122, 0.15)',
                            color: 'var(--error)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            fontFamily: 'var(--font-body)',
                            border: '1px solid var(--error)',
                          }}>
                            已过期
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            background: 'rgba(122, 142, 184, 0.15)',
                            color: 'var(--info)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            fontFamily: 'var(--font-body)',
                            border: '1px solid var(--info)',
                          }}>
                            {daysRemaining > 0
                              ? `剩余${daysRemaining}天${hoursRemaining}小时`
                              : hoursRemaining > 0
                                ? `剩余${hoursRemaining}小时`
                                : '即将过期'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(expiry.short_code)}
                          disabled={deleteMutation.isPending}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--error)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--error)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            fontFamily: 'var(--font-body)',
                            transition: 'all var(--transition-base)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(184, 122, 122, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--error)';
                            e.currentTarget.style.transform = 'translateY(0)';
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
              gap: '0.75rem',
              marginTop: '2rem',
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: page === 1 ? 'var(--gray-700)' : 'var(--accent-primary)',
                  color: page === 1 ? 'var(--text-tertiary)' : '#ffffff',
                  border: '1px solid',
                  borderColor: page === 1 ? 'var(--border-subtle)' : 'var(--accent-primary)',
                  borderRadius: '6px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                  }
                }}
              >
                上一页
              </button>
              <span style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontWeight: '500',
              }}>
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: page === totalPages ? 'var(--gray-700)' : 'var(--accent-primary)',
                  color: page === totalPages ? 'var(--text-tertiary)' : '#ffffff',
                  border: '1px solid',
                  borderColor: page === totalPages ? 'var(--border-subtle)' : 'var(--accent-primary)',
                  borderRadius: '6px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  if (page !== totalPages) {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== totalPages) {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                  }
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
