import { useMemo, useState } from 'react';
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
  Divider,
  Pagination,
  List,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, ReloadOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getLinkAnalyticsByShortCode } from '../api/analytics';
import type { AccessLog, APIError } from '../types/api';
import { getShortLinkUrl } from '../utils/url';
import { useResponsive } from '../hooks/useResponsive';

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { isMobile } = useResponsive();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['analytics-by-short-code', shortCode, currentPage],
    queryFn: () => getLinkAnalyticsByShortCode(shortCode, currentPage, pageSize),
    enabled: shortCode.length > 0,
    retry: false,
  });

  const analyticsData = data?.data;
  const link = analyticsData?.link;
  const accessLogs = analyticsData?.access_logs ?? [];
  const countryStats = analyticsData?.country_stats ?? {};
  const pagination = analyticsData?.pagination;

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

  // Mobile card renderers
  const renderAccessLogCard = (log: AccessLog) => (
    <Card
      key={log.id}
      size="small"
      style={{
        marginBottom: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        animation: 'fadeIn 0.3s ease-out',
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <ClockCircleOutlined style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} />
            <Text style={{ fontSize: '13px' }}>
              {new Date(log.accessed_at).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Space>
          <Tag>{log.country || '未知'}</Tag>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <GlobalOutlined style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} />
            <Text code style={{ fontSize: '12px' }}>{log.ip_address}</Text>
          </Space>
        </div>
        {log.user_agent && (
          <Text type="secondary" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
            {log.user_agent}
          </Text>
        )}
      </Space>
    </Card>
  );

  const renderCountryCard = (row: CountryStatRow) => (
    <div
      key={row.country}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        marginBottom: '8px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <Text>{row.country}</Text>
      <Text strong style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>{row.count}</Text>
    </div>
  );

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
        flexWrap: 'wrap',
        gap: '12px',
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
                <Statistic title='访问记录' value={pagination?.total ?? 0} prefix={<span style={{ fontSize: '1.5rem', marginRight: 8 }}>📝</span>} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Statistic title='访问国家/地区' value={countryRows.length} prefix={<span style={{ fontSize: '1.5rem', marginRight: 8 }}>🌍</span>} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
             <Col xs={24} md={12} lg={8}>
                <Card title='国家/地区分布' loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
                  {isMobile ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {countryRows.length === 0 ? (
                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                          暂无访问数据
                        </Text>
                      ) : (
                        countryRows.map(renderCountryCard)
                      )}
                    </div>
                  ) : (
                    <Table
                      rowKey={(row) => row.country}
                      columns={countryColumns}
                      dataSource={countryRows}
                      pagination={false}
                      locale={{ emptyText: '暂无访问数据' }}
                      scroll={{ y: 400 }}
                    />
                  )}
                </Card>
             </Col>
             <Col xs={24} md={12} lg={16}>
                <Card title='最近访问记录' loading={isLoading} bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
                  {isMobile ? (
                    <>
                      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
                        {accessLogs.length === 0 ? (
                          <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                            暂无访问记录
                          </Text>
                        ) : (
                          accessLogs.map(renderAccessLogCard)
                        )}
                      </div>
                      {(pagination?.total ?? 0) > 0 && (
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={pagination?.total ?? 0}
                          onChange={(page) => setCurrentPage(page)}
                          showSizeChanger={false}
                          simple
                          style={{ textAlign: 'center' }}
                        />
                      )}
                    </>
                  ) : (
                    <Table
                      rowKey={(row) => row.id}
                      columns={accessLogColumns}
                      dataSource={accessLogs}
                      pagination={{
                        current: currentPage,
                        pageSize,
                        total: pagination?.total ?? 0,
                        showSizeChanger: false,
                        onChange: (page) => setCurrentPage(page),
                      }}
                      locale={{ emptyText: '暂无访问记录' }}
                      scroll={{ x: 'max-content' }}
                    />
                  )}
                </Card>
             </Col>
          </Row>
        </Space>
    </div>
  );
}
