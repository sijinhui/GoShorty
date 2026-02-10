import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { getLinkAnalyticsByShortCode } from '../api/analytics';
import type { AccessLog, APIError } from '../types/api';
import { getShortLinkUrl } from '../utils/url';

const { Text, Link } = Typography;

interface CountryStatRow {
  country: string;
  count: number;
}

function normalizeShortCode(rawShortCode?: string): string {
  if (!rawShortCode) {
    return '';
  }

  const trimmed = rawShortCode.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('+') ? trimmed.slice(0, -1) : trimmed;
}

export default function LinkStats() {
  const navigate = useNavigate();
  const { shortCode: rawShortCode } = useParams();
  const shortCode = useMemo(() => normalizeShortCode(rawShortCode), [rawShortCode]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['analytics-by-short-code', shortCode],
    queryFn: () => getLinkAnalyticsByShortCode(shortCode),
    enabled: shortCode.length > 0,
    retry: false,
  });

  const analyticsData = data?.data;
  const link = analyticsData?.link;
  const accessLogs = analyticsData?.access_logs ?? [];
  const countryStats = analyticsData?.country_stats ?? {};

  const countryRows = useMemo<CountryStatRow[]>(() => {
    return Object.entries(countryStats)
      .map(([country, count]) => ({
        country: country || '未知',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [countryStats]);

  const accessLogColumns: ColumnsType<AccessLog> = [
    {
      title: '访问时间',
      dataIndex: 'accessed_at',
      key: 'accessed_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 150,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      render: (value?: string) => <Tag>{value || '未知'}</Tag>,
    },
    {
      title: 'User Agent',
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
  ];

  const countryColumns: ColumnsType<CountryStatRow> = [
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      width: 220,
    },
    {
      title: '访问次数',
      dataIndex: 'count',
      key: 'count',
      width: 140,
      align: 'right',
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
      render: (value: number) => <Text strong>{value}</Text>,
    },
  ];

  if (!shortCode) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/links')}>
            返回链接管理
          </Button>
          <Alert type='error' showIcon message='短码无效' description='请从链接管理页重新进入统计页面。' />
        </Space>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <Space size={16}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/links')}
            style={{ borderRadius: '8px' }}
          >
            返回
          </Button>
          <Typography.Title level={2} style={{ margin: 0, letterSpacing: '-0.01em' }}>
            链接统计
          </Typography.Title>
        </Space>
        
        <Button 
          icon={<ReloadOutlined spin={isFetching} />} 
          onClick={() => refetch()} 
          disabled={isFetching}
        >
          刷新
        </Button>
      </div>

        {error && (
          <Alert
            type='error'
            showIcon
            message='加载统计失败'
            description={(error as unknown as APIError).error || '未知错误'}
            style={{ marginBottom: '1.5rem' }}
          />
        )}

        <Space direction='vertical' size={24} style={{ width: '100%' }}>
          {link && (
            <Card loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Descriptions title='链接信息' column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                <Descriptions.Item label='短码'>
                  <Text code>{`${link.short_code}+`}</Text>
                </Descriptions.Item>
                <Descriptions.Item label='短链接'>
                  <Link href={getShortLinkUrl(link.short_code)} target='_blank' rel='noopener noreferrer'>
                    {getShortLinkUrl(link.short_code)}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label='原始链接'>
                  <Link href={link.original_url} target='_blank' rel='noopener noreferrer' ellipsis>
                    {link.original_url}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label='创建时间'>
                  {new Date(link.created_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Card loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Statistic title='总点击次数' value={link?.click_count ?? 0} prefix={<span style={{ fontSize: '1.5rem', marginRight: 8 }}>👆</span>} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Statistic title='访问记录' value={accessLogs.length} prefix={<span style={{ fontSize: '1.5rem', marginRight: 8 }}>📝</span>} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Statistic title='访问国家/地区' value={countryRows.length} prefix={<span style={{ fontSize: '1.5rem', marginRight: 8 }}>🌍</span>} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
             <Col xs={24} lg={12}>
                <Card title='国家/地区分布' loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
                  <Table
                    rowKey={(row) => row.country}
                    columns={countryColumns}
                    dataSource={countryRows}
                    pagination={false}
                    locale={{ emptyText: '暂无访问数据' }}
                    scroll={{ y: 400 }}
                  />
                </Card>
             </Col>
             <Col xs={24} lg={12}>
                <Card title='最近访问记录' loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
                  <Table
                    rowKey={(row) => row.id}
                    columns={accessLogColumns}
                    dataSource={accessLogs}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    locale={{ emptyText: '暂无访问记录' }}
                    scroll={{ x: 'max-content' }}
                  />
                </Card>
             </Col>
          </Row>
        </Space>
    </div>
  );
}
