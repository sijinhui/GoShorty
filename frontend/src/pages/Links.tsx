import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Typography, message, Card, Button, Space, Tooltip, Input } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { getLinks, deleteLink } from '../api/links';
import { getExpiredLinks } from '../api/linkExpiry';
import LinkTable from '../components/links/LinkTable';
import type { APIError } from '../types/api';
import { useResponsive } from '../hooks/useResponsive';

const { Title } = Typography;

export default function Links() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { isMobile } = useResponsive();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['links', page, keyword],
    queryFn: () => getLinks(page, 10, keyword || undefined),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  // 预取下一页数据
  useEffect(() => {
    if (data?.pagination.has_next) {
      queryClient.prefetchQuery({
        queryKey: ['links', page + 1, keyword],
        queryFn: () => getLinks(page + 1, 10, keyword || undefined),
        staleTime: 30000,
      });
    }
  }, [data, page, keyword, queryClient]);

  // 搜索时重置到第一页
  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  // 清空搜索
  const handleClearSearch = () => {
    setSearchValue('');
    setKeyword('');
    setPage(1);
  };

  // 获取所有有过期设置的链接
  const { data: expiryData } = useQuery({
    queryKey: ['all-expiry-links'],
    queryFn: () => getExpiredLinks(10000, 0), // 获取所有
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      messageApi.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
    onError: () => {
      messageApi.error('删除失败');
    },
  });

  // 创建短码集合，用于快速查找
  const expiryShortCodes = new Set(
    expiryData?.data?.expiries?.map(e => e.short_code) || []
  );

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
        加载失败：{(error as unknown as APIError).error || '未知错误'}
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {contextHolder}

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Title level={2} style={{ margin: 0 }}>链接管理</Title>
        <Space>
          <Input.Search
            placeholder="搜索短码、原始链接或标题"
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            style={{ width: isMobile ? '200px' : '300px' }}
            prefix={<SearchOutlined />}
          />
          <Tooltip title="刷新列表">
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              disabled={isFetching}
            />
          </Tooltip>
        </Space>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ boxShadow: 'var(--shadow-sm)', borderRadius: '8px', overflow: 'hidden' }}
      >
        {data && (
          <LinkTable
            links={data.data}
            pagination={data.pagination}
            onPageChange={setPage}
            onDelete={(id) => deleteMutation.mutate(id)}
            expiryShortCodes={expiryShortCodes}
            loading={isLoading || isFetching}
          />
        )}
      </Card>
    </div>
  );
}
