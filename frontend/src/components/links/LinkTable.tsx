import { Table, Tag, Typography, Button, Popconfirm, Space, Tooltip, Badge } from 'antd';
import { DeleteOutlined, ClockCircleOutlined, GlobalOutlined, LinkOutlined } from '@ant-design/icons';
import type { Link, PaginationMeta } from '../../types/api';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface LinkTableProps {
  links: Link[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onDelete: (id: number) => void;
  expiryShortCodes: Set<string>;
  loading?: boolean;
}

export default function LinkTable({
  links,
  pagination,
  onPageChange,
  onDelete,
  expiryShortCodes,
  loading = false
}: LinkTableProps) {

  const columns: ColumnsType<Link> = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      width: 180,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Text copyable strong style={{ fontFamily: 'monospace' }}>{text}</Text>
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
      width: 100,
      align: 'right',
      render: (_, record) => (
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
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={links}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        onChange: onPageChange,
        showTotal: (total) => `共 ${total} 条链接`,
        position: ['bottomCenter'],
      }}
      scroll={{ x: 1000 }}
    />
  );
}

