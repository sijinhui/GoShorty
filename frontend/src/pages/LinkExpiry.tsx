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
  Tooltip,
  Divider,
  Pagination
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, CloseCircleOutlined, CopyOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { getExpiredLinks, deleteExpiredLink, deleteAllExpiredLinks, cancelExpiry } from '../api/linkExpiry';
import { getShortLinkUrl } from '../utils/url';
import type { LinkExpiry } from '../api/linkExpiry';
import type { ColumnsType } from 'antd/es/table';
import type { APIError } from '../types/api';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export default function LinkExpiryPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const { isMobile } = useResponsive();

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

  // Helper function to calculate time remaining
  const getTimeStatus = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    const timeRemaining = new Date(expiresAt).getTime() - new Date().getTime();
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (isExpired) {
      return { text: '已过期', color: 'error' as const, isExpired: true };
    }

    let timeText = '';
    if (daysRemaining > 0) timeText = `${daysRemaining}天${hoursRemaining}小时`;
    else if (hoursRemaining > 0) timeText = `${hoursRemaining}小时`;
    else timeText = '即将过期';

    return { text: timeText, color: 'warning' as const, isExpired: false };
  };

  // Mobile card view renderer
  const renderMobileCard = (record: LinkExpiry) => {
    const shortUrl = getShortLinkUrl(record.short_code);
    const status = getTimeStatus(record.expires_at);

    return (
      <Card
        key={record.id}
        style={{
          marginBottom: '16px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        {/* Header: Short Code with Status */}
        <div style={{ marginBottom: '12px' }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                copyable={{
                  text: shortUrl,
                  icon: <CopyOutlined style={{ fontSize: '14px' }} />,
                  onCopy: () => messageApi.success('短链接已复制'),
                }}
                strong
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  color: 'var(--accent-primary)',
                }}
              >
                {record.short_code}
              </Text>
              <Tag
                color={status.color}
                icon={status.isExpired ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />}
                style={{ margin: 0 }}
              >
                {status.text}
              </Tag>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--border-subtle)' }} />

        {/* Time Information */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
          padding: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
        }}>
          <div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>创建时间</Text>
            <Space size={4} style={{ marginTop: '2px' }}>
              <CalendarOutlined style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} />
              <Text style={{ fontSize: '12px' }}>
                {new Date(record.created_at).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Space>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>过期时间</Text>
            <Space size={4} style={{ marginTop: '2px' }}>
              <ClockCircleOutlined style={{ fontSize: '12px', color: status.isExpired ? 'var(--error)' : 'var(--warning)' }} />
              <Text style={{ fontSize: '12px', color: status.isExpired ? 'var(--error)' : 'inherit' }}>
                {new Date(record.expires_at).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Space>
          </div>
        </div>

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={8}>
          <Popconfirm
            title="取消过期"
            description={`取消 ${record.short_code} 的过期设置？链接将永不过期。`}
            onConfirm={() => cancelExpiryMutation.mutate(record.short_code)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ loading: cancelExpiryMutation.isPending }}
          >
            <Button
              type="default"
              size="small"
              icon={<CloseCircleOutlined />}
              style={{
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
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
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      </Card>
    );
  };

  // Mobile view
  if (isMobile) {
    return (
      <div style={{ padding: '16px' }}>
        {contextHolder}

        <div style={{ marginBottom: '20px' }}>
          <Title level={2} style={{ margin: '0 0 16px 0', fontSize: '24px' }}>链接过期管理</Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              disabled={isFetching}
              block
              style={{ borderRadius: '8px' }}
            >
              刷新列表
            </Button>
            <Popconfirm
              title="警告"
              description={`确定要删除所有 ${total} 条已过期的链接吗？此操作将同时删除链接本身，不可撤销！`}
              onConfirm={() => deleteAllMutation.mutate()}
              okText="全部删除"
              cancelText="取消"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              okButtonProps={{ danger: true, loading: deleteAllMutation.isPending }}
              disabled={total === 0}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                disabled={total === 0}
                block
                style={{ borderRadius: '8px' }}
              >
                删除所有已过期链接 ({total})
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">加载中...</Text>
          </div>
        ) : expiries.length === 0 ? (
          <Card style={{
            textAlign: 'center',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Text type="secondary">暂无过期链接</Text>
          </Card>
        ) : (
          <>
            {expiries.map(renderMobileCard)}
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setPage(p)}
              showTotal={(total) => `共 ${total} 条`}
              style={{
                textAlign: 'center',
                marginTop: '16px',
                paddingBottom: '16px',
              }}
              showSizeChanger={false}
              simple
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {contextHolder}

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Title level={2} style={{ margin: 0 }}>链接过期管理</Title>
        <Space>
          <Tooltip title="刷新列表">
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              disabled={isFetching}
            />
          </Tooltip>
          <Popconfirm
            title="警告"
            description={`确定要删除所有 ${total} 条已过期的链接吗？此操作将同时删除链接本身，不可撤销！`}
            onConfirm={() => deleteAllMutation.mutate()}
            okText="全部删除"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            okButtonProps={{ danger: true, loading: deleteAllMutation.isPending }}
            disabled={total === 0}
          >
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              disabled={total === 0}
            >
              删除所有已过期链接 ({total})
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ boxShadow: 'var(--shadow-sm)', borderRadius: '8px', overflow: 'hidden' }}
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

