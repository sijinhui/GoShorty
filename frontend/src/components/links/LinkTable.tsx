import type { Link, PaginationMeta } from '../../types/api';
import LinkRow from './LinkRow';

interface LinkTableProps {
  links: Link[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onDelete: (id: number) => void;
}

export default function LinkTable({ links, pagination, onPageChange, onDelete }: LinkTableProps) {
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
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>短码</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>原始链接</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>点击数</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>状态</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>创建时间</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <LinkRow key={link.id} link={link} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控制 */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
          共 {pagination.total} 条
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
            style={{
              padding: '0.5rem 1rem',
              background: pagination.has_prev ? '#667eea' : '#e5e7eb',
              color: pagination.has_prev ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
            }}
          >
            上一页
          </button>

          <span style={{
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
          }}>
            第 {pagination.page} / {pagination.total_pages} 页
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
            style={{
              padding: '0.5rem 1rem',
              background: pagination.has_next ? '#667eea' : '#e5e7eb',
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
