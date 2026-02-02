import type { Link, PaginationMeta } from '../../types/api';
import LinkRow from './LinkRow';

interface LinkTableProps {
  links: Link[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onDelete: (id: number) => void;
  expiryShortCodes: Set<string>;
}

export default function LinkTable({ links, pagination, onPageChange, onDelete, expiryShortCodes }: LinkTableProps) {
  if (!links || links.length === 0) {
    return (
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
        暂无链接数据
      </div>
    );
  }

  return (
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
          <tr style={{
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
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
            }}>原始链接</th>
            <th style={{
              padding: '1rem 0.875rem',
              textAlign: 'left',
              fontSize: '0.8125rem',
              fontWeight: '700',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>IP</th>
            <th style={{
              padding: '1rem 0.875rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: '700',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>点击数</th>
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
              textAlign: 'left',
              fontSize: '0.8125rem',
              fontWeight: '700',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>创建时间</th>
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
            {links.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                onDelete={onDelete}
                hasExpiry={expiryShortCodes.has(link.short_code)}
              />
            ))}
          </tbody>
        </table>

      {/* 分页控制 */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-hover)',
      }}>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontWeight: '500',
        }}>
          第 {pagination.page} / {pagination.total_pages} 页
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
            style={{
              padding: '0.625rem 1.25rem',
              background: pagination.has_prev ? 'var(--accent-primary)' : 'var(--gray-700)',
              color: pagination.has_prev ? '#ffffff' : 'var(--text-tertiary)',
              border: '1px solid',
              borderColor: pagination.has_prev ? 'var(--accent-primary)' : 'var(--border-subtle)',
              borderRadius: '6px',
              cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              if (pagination.has_prev) {
                e.currentTarget.style.background = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (pagination.has_prev) {
                e.currentTarget.style.background = 'var(--accent-primary)';
              }
            }}
          >
            上一页
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
            style={{
              padding: '0.625rem 1.25rem',
              background: pagination.has_next ? 'var(--accent-primary)' : 'var(--gray-700)',
              color: pagination.has_next ? '#ffffff' : 'var(--text-tertiary)',
              border: '1px solid',
              borderColor: pagination.has_next ? 'var(--accent-primary)' : 'var(--border-subtle)',
              borderRadius: '6px',
              cursor: pagination.has_next ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              if (pagination.has_next) {
                e.currentTarget.style.background = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (pagination.has_next) {
                e.currentTarget.style.background = 'var(--accent-primary)';
              }
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
