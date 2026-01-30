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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fee',
        color: '#c33',
        padding: '1rem',
        borderRadius: '4px',
      }}>
        加载失败：{(error as any).error || '未知错误'}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
      }}>
        仪表盘
      </h1>

      {data?.data && <StatsCards stats={data.data} />}

      <CreateLinkForm onSuccess={() => refetch()} />
    </div>
  );
}
