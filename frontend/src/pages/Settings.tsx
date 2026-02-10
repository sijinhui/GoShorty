import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';
import { getPlugins, updatePluginConfig } from '../api/plugins';
import { exportLinks, importLinks } from '../api/links';

export default function Settings() {
  const queryClient = useQueryClient();
  const [shortCodeLength, setShortCodeLength] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [pluginSuccessMessage, setPluginSuccessMessage] = useState<string>('');
  const [importMessage, setImportMessage] = useState<string>('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 速率限制配置状态
  const [rateLimitEnabled, setRateLimitEnabled] = useState<boolean>(false);
  const [requestsLimit, setRequestsLimit] = useState<number>(10);
  const [windowMinutes, setWindowMinutes] = useState<number>(1);

  // 插件配置状态
  const [pluginConfigs, setPluginConfigs] = useState<{[key: string]: {enabled: boolean, days?: number}}>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  // 获取插件列表
  const { data: pluginsData, isLoading: pluginsLoading, error: pluginsError } = useQuery({
    queryKey: ['plugins'],
    queryFn: getPlugins,
  });

  // 当数据加载完成后，更新状态
  useEffect(() => {
    if (data?.data) {
      setShortCodeLength(data.data.short_code_length);

      // 初始化速率限制配置
      if (data.data.rate_limit) {
        setRateLimitEnabled(data.data.rate_limit.enabled || false);
        setRequestsLimit(data.data.rate_limit.requests_limit || 10);
        setWindowMinutes(data.data.rate_limit.window_minutes || 1);
      }
    }
  }, [data]);

  // 初始化插件配置状态
  useEffect(() => {
    if (pluginsData?.data?.plugins) {
      const configs: {[key: string]: {enabled: boolean, days?: number}} = {};
      pluginsData.data.plugins.forEach(plugin => {
        configs[plugin.name] = {
          enabled: plugin.enabled,
          days: plugin.days ? parseInt(plugin.days) : undefined,
        };
      });
      setPluginConfigs(configs);
    }
  }, [pluginsData]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMessage('设置已更新');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const pluginMutation = useMutation({
    mutationFn: ({ name, config }: { name: string; config: { enabled: boolean; days?: number } }) =>
      updatePluginConfig(name, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      setPluginSuccessMessage('插件配置已更新，重启服务器后生效');
      setTimeout(() => setPluginSuccessMessage(''), 5000);
    },
  });

  const importMutation = useMutation({
    mutationFn: importLinks,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      setImportMessage(data.message || '导入完成');
      if (data.data?.errors) {
        setImportErrors(data.data.errors);
      }
      setTimeout(() => {
        setImportMessage('');
        setImportErrors([]);
      }, 10000);
    },
    onError: (error: any) => {
      setImportMessage(error?.error || '导入失败');
      setTimeout(() => setImportMessage(''), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (shortCodeLength < 3 || shortCodeLength > 20) {
      return;
    }

    mutation.mutate({ short_code_length: shortCodeLength });
  };

  const isShortCodeInvalid = shortCodeLength < 3 || shortCodeLength > 20;
  const isSubmitDisabled = mutation.isPending || isShortCodeInvalid;

  const handleRateLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    mutation.mutate({
      short_code_length: shortCodeLength,
      rate_limit: {
        enabled: rateLimitEnabled,
        requests_limit: requestsLimit,
        window_minutes: windowMinutes,
      },
    });
  };

  const handlePluginUpdate = (pluginName: string) => {
    setPluginSuccessMessage('');
    const config = pluginConfigs[pluginName];
    if (!config) return;

    pluginMutation.mutate({
      name: pluginName,
      config: {
        enabled: config.enabled,
        days: config.days,
      },
    });
  };

  const handleExport = async () => {
    try {
      const blob = await exportLinks();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `links_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('导出成功');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setSuccessMessage('导出失败：' + (error?.error || '未知错误'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportMessage('请选择CSV文件');
      setTimeout(() => setImportMessage(''), 3000);
      return;
    }

    setImportMessage('');
    setImportErrors([]);
    importMutation.mutate(file);

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading || pluginsLoading) {
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

  if (error || pluginsError) {
    return (
      <div style={{
        background: 'rgba(184, 122, 122, 0.15)',
        color: 'var(--error)',
        padding: '1rem',
        borderRadius: '10px',
        border: '1px solid var(--error)',
        fontFamily: 'var(--font-body)',
      }}>
        加载失败：{(error as any)?.error || (pluginsError as any)?.error || '未知错误'}
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
        系统设置
      </h1>

      {successMessage && (
        <div style={{
          background: 'rgba(107, 142, 127, 0.15)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--success)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {successMessage}
        </div>
      )}

      {pluginSuccessMessage && (
        <div style={{
          background: 'rgba(107, 142, 127, 0.15)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--success)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {pluginSuccessMessage}
        </div>
      )}

      {mutation.isError && (
        <div style={{
          background: 'rgba(184, 122, 122, 0.15)',
          color: 'var(--error)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--error)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          更新失败：{(mutation.error as any)?.error || '未知错误'}
        </div>
      )}

      {pluginMutation.isError && (
        <div style={{
          background: 'rgba(184, 122, 122, 0.15)',
          color: 'var(--error)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--error)',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          插件配置更新失败：{(pluginMutation.error as any)?.error || '未知错误'}
        </div>
      )}

      {/* 短链接设置 */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.75rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out 0.1s backwards',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          短链接设置
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.625rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}>
              短链接长度
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={shortCodeLength}
              onChange={(e) => setShortCodeLength(parseInt(e.target.value) || 3)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all var(--transition-base)',
              }}
            />
            <p style={{
              marginTop: '0.625rem',
              fontSize: '0.875rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-body)',
            }}>
              设置短链接代码的长度（3-20位）。当前设置：{shortCodeLength}位
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            style={{
              background: isSubmitDisabled ? 'var(--gray-700)' : 'var(--accent-primary)',
              color: isSubmitDisabled ? 'var(--text-tertiary)' : '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: isSubmitDisabled ? 'var(--border-subtle)' : 'var(--accent-primary)',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-base)',
            }}
          >
            {mutation.isPending ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>

      {/* 速率限制设置 */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.75rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out 0.2s backwards',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          速率限制设置
        </h2>

        <form onSubmit={handleRateLimitSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.375rem',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                }}>
                  启用速率限制
                </label>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  防止公开API被滥用，限制每个IP的请求频率
                </p>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px',
              }}>
                <input
                  type="checkbox"
                  checked={rateLimitEnabled}
                  onChange={(e) => setRateLimitEnabled(e.target.checked)}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: rateLimitEnabled ? 'var(--accent-primary)' : 'var(--gray-600)',
                  transition: '0.4s',
                  borderRadius: '24px',
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: rateLimitEnabled ? '23px' : '3px',
                    bottom: '3px',
                    background: 'var(--text-primary)',
                    transition: '0.4s',
                    borderRadius: '50%',
                  }} />
                </span>
              </label>
            </div>
          </div>

          {rateLimitEnabled && (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.625rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}>
                  请求次数限制
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={requestsLimit}
                  onChange={(e) => setRequestsLimit(parseInt(e.target.value) || 10)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-body)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all var(--transition-base)',
                  }}
                />
                <p style={{
                  marginTop: '0.625rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  时间窗口内允许的最大请求次数（1-1000次）
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.625rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}>
                  时间窗口（分钟）
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={windowMinutes}
                  onChange={(e) => setWindowMinutes(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-body)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all var(--transition-base)',
                  }}
                />
                <p style={{
                  marginTop: '0.625rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  速率限制的时间窗口大小（1-60分钟）。当前设置：每{windowMinutes}分钟最多{requestsLimit}次请求
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              background: mutation.isPending ? 'var(--gray-700)' : 'var(--accent-primary)',
              color: mutation.isPending ? 'var(--text-tertiary)' : '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: mutation.isPending ? 'var(--border-subtle)' : 'var(--accent-primary)',
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-base)',
            }}
          >
            {mutation.isPending ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>

      {/* 插件管理 */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.75rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out 0.3s backwards',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          插件管理
        </h2>

        {pluginsData?.data?.plugins && pluginsData.data.plugins.length > 0 ? (
          <div>
            {pluginsData.data.plugins.map((plugin) => (
              <div
                key={plugin.name}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                  background: 'var(--bg-secondary)',
                  transition: 'all var(--transition-base)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '0.375rem',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--text-primary)',
                    }}>
                      {plugin.name === 'seven_day_expiry' ? '7天过期插件' : plugin.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      版本: {plugin.version} | 类型: {plugin.type === 'expiry' ? '过期策略' : '链接'}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {pluginConfigs[plugin.name]?.enabled ? '已启用' : '已禁用'}
                    </span>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '44px',
                      height: '24px',
                    }}>
                      <input
                        type="checkbox"
                        checked={pluginConfigs[plugin.name]?.enabled || false}
                        onChange={(e) => {
                          setPluginConfigs({
                            ...pluginConfigs,
                            [plugin.name]: {
                              ...pluginConfigs[plugin.name],
                              enabled: e.target.checked,
                            },
                          });
                        }}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0,
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: pluginConfigs[plugin.name]?.enabled ? 'var(--accent-primary)' : 'var(--gray-600)',
                        transition: '0.4s',
                        borderRadius: '24px',
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: pluginConfigs[plugin.name]?.enabled ? '23px' : '3px',
                          bottom: '3px',
                          background: 'var(--text-primary)',
                          transition: '0.4s',
                          borderRadius: '50%',
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                {plugin.name === 'seven_day_expiry' && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.625rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-secondary)',
                    }}>
                      默认过期天数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={pluginConfigs[plugin.name]?.days || 7}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 7;
                        setPluginConfigs({
                          ...pluginConfigs,
                          [plugin.name]: {
                            ...pluginConfigs[plugin.name],
                            days: days,
                          },
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-body)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all var(--transition-base)',
                      }}
                    />
                    <p style={{
                      marginTop: '0.625rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      设置链接的默认过期天数（1-365天）
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handlePluginUpdate(plugin.name)}
                  disabled={pluginMutation.isPending}
                  style={{
                    marginTop: '1rem',
                    background: pluginMutation.isPending ? 'var(--gray-700)' : 'var(--success)',
                    color: 'var(--text-primary)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: pluginMutation.isPending ? 'var(--border-subtle)' : 'var(--success)',
                    cursor: pluginMutation.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    fontFamily: 'var(--font-body)',
                    transition: 'all var(--transition-base)',
                  }}
                >
                  {pluginMutation.isPending ? '保存中...' : '保存插件配置'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}>暂无可用插件</p>
        )}
      </div>

      {/* 数据导入导出 */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1.75rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        animation: 'fadeIn 0.5s ease-out 0.4s backwards',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          数据导入导出
        </h2>

        {importMessage && (
          <div style={{
            background: importMutation.isError ? 'rgba(184, 122, 122, 0.15)' : 'rgba(107, 142, 127, 0.15)',
            color: importMutation.isError ? 'var(--error)' : 'var(--success)',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            border: '1px solid',
            borderColor: importMutation.isError ? 'var(--error)' : 'var(--success)',
            fontFamily: 'var(--font-body)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            {importMessage}
            {importErrors.length > 0 && (
              <ul style={{
                marginTop: '0.75rem',
                marginLeft: '1.25rem',
                fontSize: '0.875rem',
              }}>
                {importErrors.map((error, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handleExport}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--accent-primary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📥</span>
            导出CSV
          </button>

          <label style={{
            background: 'var(--success)',
            color: 'var(--text-primary)',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--success)',
            cursor: importMutation.isPending ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition-base)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: importMutation.isPending ? 0.6 : 1,
          }}>
            <span>📤</span>
            {importMutation.isPending ? '导入中...' : '导入CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importMutation.isPending}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{
          marginTop: '1.25rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            marginBottom: '0.625rem',
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
          }}>
            CSV 格式说明
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            marginBottom: '0.5rem',
          }}>
            CSV 文件应包含以下列（表头）：
          </p>
          <ul style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            marginLeft: '1.25rem',
            lineHeight: '1.6',
          }}>
            <li><strong>source</strong>: 短码（必填）</li>
            <li><strong>target</strong>: 目标URL（必填）</li>
            <li><strong>hits</strong>: 点击次数（可选，导入时忽略）</li>
          </ul>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-body)',
            marginTop: '0.75rem',
          }}>
            注意：导入时如果短码已存在，该条记录将被跳过。
          </p>
        </div>
      </div>
    </div>
  );
}
