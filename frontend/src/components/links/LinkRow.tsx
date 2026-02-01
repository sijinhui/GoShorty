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
      return <span style={{ color: 'var(--warning)', fontWeight: '600', fontFamily: 'var(--font-body)' }}>已禁用</span>;
    }
    return <span style={{ color: 'var(--success)', fontWeight: '600', fontFamily: 'var(--font-body)' }}>活跃</span>;
  };

  return (
    <tr style={{
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background var(--transition-fast)',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '0.875rem' }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
        }}>{link.short_code}</div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
          {link.custom_code && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--success)',
              background: 'rgba(107, 142, 127, 0.15)',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-block',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              border: '1px solid rgba(107, 142, 127, 0.3)',
            }}>
              自定义
            </span>
          )}
          {hasExpiry && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--info)',
              background: 'rgba(122, 142, 184, 0.15)',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-block',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              border: '1px solid rgba(122, 142, 184, 0.3)',
            }}>
              ⏰
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '0.875rem', maxWidth: '300px' }}>
        <a
          href={link.original_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
        >
          {link.original_url}
        </a>
        {link.title && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginTop: '0.375rem',
            fontFamily: 'var(--font-body)',
          }}>
            {link.title}
          </div>
        )}
      </td>
      <td style={{
        padding: '0.875rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        fontFamily: 'monospace',
      }}>
        {link.created_ip || '-'}
      </td>
      <td style={{
        padding: '0.875rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontFamily: 'var(--font-body)',
        fontWeight: '600',
        color: 'var(--text-primary)',
      }}>
        {link.click_count}
      </td>
      <td style={{ padding: '0.875rem', fontSize: '0.875rem' }}>
        {getStatusBadge()}
      </td>
      <td style={{
        padding: '0.875rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
      }}>
        {new Date(link.created_at).toLocaleString('zh-CN')}
      </td>
      <td style={{ padding: '0.875rem', textAlign: 'right' }}>
        <button
          onClick={handleDelete}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--error)',
            color: '#ffffff',
            border: '1px solid var(--error)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            fontWeight: '600',
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
}
