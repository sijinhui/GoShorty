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
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
      }}>
        统计分析
      </h1>

      {/* 搜索表单 */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem',
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
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            查询
          </button>
        </form>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>加载中...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
        }}>
          加载失败：{(error as any).error || '未知错误'}
        </div>
      )}

      {/* 统计数据 */}
      {data?.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 链接信息卡片 */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              链接信息
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: '500' }}>短码：</span>
                <span>{data.data.link.short_code}</span>
              </div>
              <div>
                <span style={{ fontWeight: '500' }}>原始链接：</span>
                <a
                  href={data.data.link.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667eea', textDecoration: 'none' }}
                >
                  {data.data.link.original_url}
                </a>
              </div>
              <div>
                <span style={{ fontWeight: '500' }}>总点击数：</span>
                <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                  {data.data.link.click_count}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500' }}>创建时间：</span>
                <span>{new Date(data.data.link.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>

          {/* 国家统计卡片 */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              国家/地区分布
            </h2>
            {Object.keys(data.data.country_stats).length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>
                      国家/地区
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      访问次数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.data.country_stats).map(([country, count]) => (
                    <tr key={country} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>{country || '未知'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
                暂无数据
              </div>
            )}
          </div>

          {/* 访问日志卡片 */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              访问日志（最近50条）
            </h2>
            {data.data.access_logs.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>
                        访问时间
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>
                        IP地址
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>
                        国家/地区
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>
                        城市
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.access_logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {new Date(log.accessed_at).toLocaleString('zh-CN')}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {log.ip_address}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {log.country || '-'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {log.city || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
                暂无访问记录
              </div>
            )}
          </div>
        </div>
      )}

      {/* 初始提示 */}
      {!searchId && !isLoading && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666',
        }}>
          请输入链接ID查询统计数据
        </div>
      )}
    </div>
  );
}
