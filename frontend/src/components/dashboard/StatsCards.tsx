import type { DashboardStats } from '../../types/api';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: '总链接数', value: stats.total_links, color: '#667eea' },
    { label: '活跃链接', value: stats.active_links, color: '#48bb78' },
    { label: '今日点击', value: stats.today_clicks, color: '#ed8936' },
    { label: '总点击数', value: stats.total_clicks, color: '#9f7aea' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '0.5rem',
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: card.color,
          }}>
            {card.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
