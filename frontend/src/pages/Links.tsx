import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLinks, deleteLink } from '../api/links';
import LinkTable from '../components/links/LinkTable';

export default function Links() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['links', page],
    queryFn: () => getLinks(page, 20),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      alert('删除失败');
    }
  };

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
        链接管理
      </h1>

      {data && (
        <LinkTable
          links={data.data}
          pagination={data.pagination}
          onPageChange={setPage}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
