import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/links';
import StatsCards from '../components/dashboard/StatsCards';
import CreateLinkForm from '../components/dashboard/CreateLinkForm';

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // 30秒自动刷新
  });

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
        仪表盘
      </h1>

      {data?.data && <StatsCards stats={data.data} />}

      <CreateLinkForm onSuccess={() => refetch()} />
    </div>
  );
}
