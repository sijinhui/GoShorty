import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Popconfirm,
  Tag,
  Typography,
  Card,
  Space,
  message,
  Tooltip
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getExpiredLinks, deleteExpiredLink, deleteAllExpiredLinks, cancelExpiry } from '../api/linkExpiry';
import { getShortLinkUrl } from '../utils/url';
import type { LinkExpiry } from '../api/linkExpiry';
import type { ColumnsType } from 'antd/es/table';
import type { APIError } from '../types/api';

const { Title } = Typography;

export default function LinkExpiryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expired-links', page],
    queryFn: () => getExpiredLinks(pageSize, offset),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpiredLink,
    onSuccess: () => {
      messageApi.success('链接已删除');
      queryClient.invalidateQueries({ queryKey: ['expired-links'] });
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
    onError: (error: APIError) => {
      messageApi.error(error?.error || '删除失败');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllExpiredLinks,
    onSuccess: (result) => {
      messageApi.success(`成功删除 ${result.data?.deleted_count || 0} 条过期链接`);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['expired-links'] });
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
    onError: (error: APIError) => {
      messageApi.error(error?.error || '批量删除失败');
    },
  });

  const cancelExpiryMutation = useMutation({
    mutationFn: cancelExpiry,
    onSuccess: () => {
      messageApi.success('已取消过期设置，链接将永不过期');
      queryClient.invalidateQueries({ queryKey: ['expired-links'] });
    },
    onError: (error: APIError) => {
      messageApi.error(error?.error || '取消过期失败');
    },
  });

  const columns: ColumnsType<LinkExpiry> = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      render: (text) => (
        <Typography.Text
          copyable={{
            text: getShortLinkUrl(text),
            onCopy: () => {
              messageApi.success('短链接已复制到剪贴板');
            }
          }}
          strong
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const isExpired = new Date(record.expires_at) < new Date();
        const timeRemaining = new Date(record.expires_at).getTime() - new Date().getTime();
        const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (isExpired) {
          return <Tag color="error">已过期</Tag>;
        }

        let timeText = '';
        if (daysRemaining > 0) timeText = `${daysRemaining}天${hoursRemaining}小时`;
        else if (hoursRemaining > 0) timeText = `${hoursRemaining}小时`;
        else timeText = '即将过期';

        return <Tag color="warning">{timeText}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="取消过期"
            description={`取消 ${record.short_code} 的过期设置？链接将永不过期。`}
            onConfirm={() => cancelExpiryMutation.mutate(record.short_code)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ loading: cancelExpiryMutation.isPending }}
          >
            <Button type="link" size="small" icon={<CloseCircleOutlined />}>
              取消过期
            </Button>
          </Popconfirm>
          <Popconfirm
            title="删除链接"
            description={`确定要删除链接 ${record.short_code} 吗？此操作将同时删除链接本身！`}
            onConfirm={() => deleteMutation.mutate(record.short_code)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expiries = data?.data?.expiries || [];
  const total = data?.data?.total || 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {contextHolder}

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>链接过期管理</Title>
        <Space>
          <Tooltip title="刷新列表">
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              disabled={isFetching}
            />
          </Tooltip>
          {total > 0 && (
            <Popconfirm
              title="警告"
              description={`确定要删除所有 ${total} 条已过期的链接吗？此操作将同时删除链接本身，不可撤销！`}
              onConfirm={() => deleteAllMutation.mutate()}
              okText="全部删除"
              cancelText="取消"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              okButtonProps={{ danger: true, loading: deleteAllMutation.isPending }}
            >
              <Button danger type="primary" icon={<DeleteOutlined />}>
                删除所有已过期链接 ({total})
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          dataSource={expiries}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (p) => setPage(p),
            showTotal: (total) => `共 ${total} 条记录`,
            position: ['bottomCenter'],
          }}
        />
      </Card>
    </div>
  );
}

