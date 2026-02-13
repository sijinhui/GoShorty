import { Table, Tag, Typography, Button, Popconfirm, Space, Tooltip, Badge, message, Card, Divider, Pagination } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, GlobalOutlined, LinkOutlined, BarChartOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Link, PaginationMeta } from '../../types/api';
import type { ColumnsType } from 'antd/es/table';
import { getShortLinkUrl } from '../../utils/url';
import { useResponsive } from '../../hooks/useResponsive';

const { Text } = Typography;

interface LinkTableProps {
  links: Link[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onDelete: (id: number) => void;
  expiryShortCodes: Set<string>;
  loading?: boolean;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
}

export default function LinkTable({
  links,
  pagination,
  onPageChange,
  onDelete,
  expiryShortCodes,
  loading = false,
  selectedRowKeys,
  onSelectionChange
}: LinkTableProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const columns: ColumnsType<Link> = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      width: 180,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text
            copyable={{
              text: getShortLinkUrl(text),
              onCopy: () => {
                messageApi.success('短链接已复制到剪贴板');
              }
            }}
            strong
            style={{ fontFamily: 'monospace' }}
          >
            {text}
          </Text>
          <Space size={4}>
            {record.custom_code && (
              <Tag color="success" style={{ fontSize: '10px', lineHeight: '18px' }}>自定义</Tag>
            )}
            {expiryShortCodes.has(record.short_code) && (
              <Tooltip title="设有过期时间">
                <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontSize: '10px', lineHeight: '18px' }}>
                  限时
                </Tag>
              </Tooltip>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: '原始链接',
      dataIndex: 'original_url',
      key: 'original_url',
      ellipsis: {
        showTitle: false,
      },
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <a
              href={text}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%' }}
            >
              <LinkOutlined />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
            </a>
            {record.title && (
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.title}</Text>
            )}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'created_ip',
      key: 'created_ip',
      width: 140,
      render: (text) => (
        <Space>
          <GlobalOutlined style={{ color: 'var(--text-tertiary)' }} />
          <Text type="secondary" style={{ fontFamily: 'monospace' }}>{text || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '点击数',
      dataIndex: 'click_count',
      key: 'click_count',
      align: 'center',
      width: 100,
      sorter: (a, b) => a.click_count - b.click_count,
      render: (count) => (
        <Badge
          count={count}
          overflowCount={9999}
          showZero
          color={count > 0 ? 'var(--accent-primary)' : 'var(--gray-400)'}
        />
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.is_active ? 'success' : 'error'}>
          {record.is_active ? '活跃' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => (
        <Text type="secondary" style={{ fontSize: '13px' }}>
          {new Date(text).toLocaleString('zh-CN')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => navigate(`/admin/links/${record.short_code}+`)}
          >
            统计
          </Button>
          <Popconfirm
            title="删除链接"
            description="确定要删除这个短链接吗？"
            onConfirm={() => onDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Mobile card view renderer
  const renderMobileCard = (link: Link) => {
    const shortUrl = getShortLinkUrl(link.short_code);

    return (
      <Card
        key={link.id}
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
        {/* Header: Short Code with Tags */}
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
                {link.short_code}
              </Text>
              <Badge
                count={link.click_count}
                overflowCount={9999}
                showZero
                style={{
                  backgroundColor: link.click_count > 0 ? 'var(--accent-primary)' : 'var(--gray-600)',
                }}
              />
            </div>

            <Space size={4} wrap>
              {link.custom_code && (
                <Tag color="success" style={{ fontSize: '11px', margin: 0 }}>自定义</Tag>
              )}
              {expiryShortCodes.has(link.short_code) && (
                <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontSize: '11px', margin: 0 }}>
                  限时
                </Tag>
              )}
              <Tag color={link.is_active ? 'success' : 'error'} style={{ fontSize: '11px', margin: 0 }}>
                {link.is_active ? '活跃' : '已禁用'}
              </Tag>
            </Space>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--border-subtle)' }} />

        {/* Original URL */}
        <div style={{ marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            原始链接
          </Text>
          <a
            href={link.original_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              wordBreak: 'break-all',
              color: 'var(--accent-primary)',
            }}
          >
            <LinkOutlined style={{ flexShrink: 0 }} />
            <span>{link.original_url}</span>
          </a>
          {link.title && (
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              {link.title}
            </Text>
          )}
        </div>

        {/* Metadata */}
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
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>创建IP</Text>
            <Space size={4} style={{ marginTop: '2px' }}>
              <GlobalOutlined style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} />
              <Text style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                {link.created_ip || '-'}
              </Text>
            </Space>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>创建时间</Text>
            <Text style={{ fontSize: '12px', marginTop: '2px', display: 'block' }}>
              {new Date(link.created_at).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        </div>

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={8}>
          <Button
            type="primary"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => navigate(`/admin/links/${link.short_code}+`)}
            style={{
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            统计
          </Button>
          <Popconfirm
            title="删除链接"
            description="确定要删除这个短链接吗？"
            onConfirm={() => onDelete(link.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
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
      <>
        {contextHolder}
        <div style={{ padding: '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">加载中...</Text>
            </div>
          ) : links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">暂无数据</Text>
            </div>
          ) : (
            <>
              {links.map(renderMobileCard)}
              <Pagination
                current={pagination.page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={onPageChange}
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
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <Table
        columns={columns}
        dataSource={links}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: onSelectionChange,
          preserveSelectedRowKeys: false,
        }}
        loading={{
          spinning: loading,
          tip: '加载中...',
        }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: onPageChange,
          showTotal: (total) => `共 ${total} 条链接`,
          position: ['bottomCenter'],
          showSizeChanger: false,
        }}
        scroll={{ x: 1000 }}
      />
    </>
  );
}

