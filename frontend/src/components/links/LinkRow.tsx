import type { Link } from '../../types/api';

interface LinkRowProps {
  link: Link;
  onDelete: (id: number) => void;
  hasExpiry: boolean;
}

export default function LinkRow({ link, onDelete, hasExpiry }: LinkRowProps) {
  const handleDelete = () => {
    if (window.confirm('确定要删除这个短链接吗？')) {
      onDelete(link.id);
    }
  };

  const getStatusBadge = () => {
    if (!link.is_active) {
      return <span style={{ color: '#f59e0b', fontWeight: '500' }}>已禁用</span>;
    }
    return <span style={{ color: '#10b981', fontWeight: '500' }}>活跃</span>;
  };

  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '0.75rem' }}>
        <div style={{ fontWeight: '500', fontSize: '0.875rem', fontFamily: 'monospace' }}>{link.short_code}</div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
          {link.custom_code && (
            <span style={{
              fontSize: '0.75rem',
              color: '#10b981',
              background: '#d1fae5',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              自定义
            </span>
          )}
          {hasExpiry && (
            <span style={{
              fontSize: '0.75rem',
              color: '#059669',
              background: '#d1fae5',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              ⏰
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '0.75rem', maxWidth: '300px' }}>
        <a
          href={link.original_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#667eea',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            fontSize: '0.875rem',
          }}
        >
          {link.original_url}
        </a>
        {link.title && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {link.title}
          </div>
        )}
      </td>
      <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>
        {link.click_count}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
        {getStatusBadge()}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
        {new Date(link.created_at).toLocaleString('zh-CN')}
      </td>
      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
        <button
          onClick={handleDelete}
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
}
