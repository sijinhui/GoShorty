import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLinkAnalytics } from '../api/analytics';

export default function Analytics() {
  const [linkId, setLinkId] = useState('');
  const [searchId, setSearchId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', searchId],
    queryFn: () => getLinkAnalytics(searchId!),
    enabled: searchId !== null,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = parseInt(linkId);
    if (!isNaN(id) && id > 0) {
      setSearchId(id);
    }
  };

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
        统计分析
      </h1>

      {/* 搜索表单 */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.75rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out 0.1s backwards',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="number"
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            placeholder="请输入链接ID"
            required
            style={{
              flex: 1,
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
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.75rem',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: '1px solid var(--accent-primary)',
              borderRadius: '8px',
              cursor: 'pointer',
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
            查询
          </button>
        </form>
      </div>

      {/* 加载状态 */}
      {isLoading && (
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
      )}

      {/* 错误状态 */}
      {error && (
        <div style={{
          background: 'rgba(184, 122, 122, 0.15)',
          color: 'var(--error)',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid var(--error)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          加载失败：{(error as any).error || '未知错误'}
        </div>
      )}

      {/* 统计数据 */}
      {data?.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 链接信息卡片 */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '1.75rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.5s ease-out 0.2s backwards',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              marginBottom: '1.25rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              链接信息
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <span style={{
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                }}>短码：</span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                }}>{data.data.link.short_code}</span>
              </div>
              <div>
                <span style={{
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                }}>原始链接：</span>
                <a
                  href={data.data.link.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-body)',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                >
                  {data.data.link.original_url}
                </a>
              </div>
              <div>
                <span style={{
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                }}>总点击数：</span>
                <span style={{
                  color: 'var(--accent-primary)',
                  fontWeight: '800',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.125rem',
                }}>
                  {data.data.link.click_count}
                </span>
              </div>
              <div>
                <span style={{
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                }}>创建时间：</span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                }}>{new Date(data.data.link.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>

          {/* 国家统计卡片 */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '1.75rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.5s ease-out 0.3s backwards',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              marginBottom: '1.25rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              国家/地区分布
            </h2>
            {Object.keys(data.data.country_stats).length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-hover)' }}>
                  <tr>
                    <th style={{
                      padding: '1rem 0.875rem',
                      textAlign: 'left',
                      fontWeight: '700',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      国家/地区
                    </th>
                    <th style={{
                      padding: '1rem 0.875rem',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      访问次数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.data.country_stats).map(([country, count]) => (
                    <tr key={country} style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{
                        padding: '0.875rem',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-primary)',
                      }}>{country || '未知'}</td>
                      <td style={{
                        padding: '0.875rem',
                        textAlign: 'right',
                        fontFamily: 'var(--font-body)',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                      }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '2rem',
                fontFamily: 'var(--font-body)',
              }}>
                暂无数据
              </div>
            )}
          </div>

          {/* 访问日志卡片 */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '1.75rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.5s ease-out 0.4s backwards',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              marginBottom: '1.25rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              访问日志（最近50条）
            </h2>
            {data.data.access_logs.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--bg-hover)' }}>
                    <tr>
                      <th style={{
                        padding: '1rem 0.875rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        访问时间
                      </th>
                      <th style={{
                        padding: '1rem 0.875rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        IP地址
                      </th>
                      <th style={{
                        padding: '1rem 0.875rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        国家/地区
                      </th>
                      <th style={{
                        padding: '1rem 0.875rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        城市
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.access_logs.map((log) => (
                      <tr key={log.id} style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{
                          padding: '0.875rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-body)',
                          color: 'var(--text-primary)',
                        }}>
                          {new Date(log.accessed_at).toLocaleString('zh-CN')}
                        </td>
                        <td style={{
                          padding: '0.875rem',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                        }}>
                          {log.ip_address}
                        </td>
                        <td style={{
                          padding: '0.875rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-body)',
                          color: 'var(--text-primary)',
                        }}>
                          {log.country || '-'}
                        </td>
                        <td style={{
                          padding: '0.875rem',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-body)',
                          color: 'var(--text-primary)',
                        }}>
                          {log.city || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '2rem',
                fontFamily: 'var(--font-body)',
              }}>
                暂无访问记录
              </div>
            )}
          </div>
        </div>
      )}

      {/* 初始提示 */}
      {!searchId && !isLoading && (
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          请输入链接ID查询统计数据
        </div>
      )}
    </div>
  );
}
