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
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
      }}>
        暂无链接数据
      </div>
    );
  }

  return (
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
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>原始链接</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>IP</th>
            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>点击数</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>状态</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>创建时间</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>操作</th>
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
        padding: '0.75rem 1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          第 {pagination.page} / {pagination.total_pages} 页
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
            style={{
              padding: '0.5rem 1rem',
              background: pagination.has_prev ? '#3b82f6' : '#e5e7eb',
              color: pagination.has_prev ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
            }}
          >
            上一页
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
            style={{
              padding: '0.5rem 1rem',
              background: pagination.has_next ? '#3b82f6' : '#e5e7eb',
              color: pagination.has_next ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.has_next ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
