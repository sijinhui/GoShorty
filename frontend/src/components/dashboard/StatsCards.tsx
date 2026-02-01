import type { DashboardStats } from '../../types/api';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: '总链接数', value: stats.total_links, color: 'var(--accent-primary)' },
    { label: '活跃链接', value: stats.active_links, color: 'var(--success)' },
    { label: '今日点击', value: stats.today_clicks, color: 'var(--warning)' },
    { label: '总点击数', value: stats.total_clicks, color: 'var(--info)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem',
      marginBottom: '2.5rem',
    }}>
      {cards.map((card, index) => (
        <div
          key={card.label}
          style={{
            background: 'var(--bg-elevated)',
            padding: '1.75rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-subtle)',
            transition: 'all var(--transition-base)',
            animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards`,
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontWeight: '600',
            letterSpacing: '0.01em',
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            color: card.color,
            letterSpacing: '-0.02em',
          }}>
            {card.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
