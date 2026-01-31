import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';
import { getPlugins, updatePluginConfig } from '../api/plugins';

export default function Settings() {
  const queryClient = useQueryClient();
  const [shortCodeLength, setShortCodeLength] = useState<number>(3);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [pluginSuccessMessage, setPluginSuccessMessage] = useState<string>('');

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
    mutationFn: ({ name, config }: { name: string; config: any }) =>
      updatePluginConfig(name, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      setPluginSuccessMessage('插件配置已更新，重启服务器后生效');
      setTimeout(() => setPluginSuccessMessage(''), 5000);
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

  if (isLoading || pluginsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (error || pluginsError) {
    return (
      <div style={{
        background: '#fee',
        color: '#c33',
        padding: '1rem',
        borderRadius: '4px',
      }}>
        加载失败：{(error as any)?.error || (pluginsError as any)?.error || '未知错误'}
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
        系统设置
      </h1>

      {successMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {successMessage}
        </div>
      )}

      {pluginSuccessMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {pluginSuccessMessage}
        </div>
      )}

      {mutation.isError && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          更新失败：{(mutation.error as any)?.error || '未知错误'}
        </div>
      )}

      {pluginMutation.isError && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          插件配置更新失败：{(pluginMutation.error as any)?.error || '未知错误'}
        </div>
      )}

      {/* 短链接设置 */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
        }}>
          短链接设置
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
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
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <p style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#666',
            }}>
              设置短链接代码的长度（3-20位）。当前设置：{shortCodeLength}位
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20}
            style={{
              background: mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20 ? '#ccc' : '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: mutation.isPending || shortCodeLength < 3 || shortCodeLength > 20 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {mutation.isPending ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>

      {/* 插件管理 */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
        }}>
          插件管理
        </h2>

        {pluginsData?.data?.plugins && pluginsData.data.plugins.length > 0 ? (
          <div>
            {pluginsData.data.plugins.map((plugin) => (
              <div
                key={plugin.name}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1rem',
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
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                    }}>
                      {plugin.name === 'seven_day_expiry' ? '7天过期插件' : plugin.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
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
                      color: '#6b7280',
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
                        background: pluginConfigs[plugin.name]?.enabled ? '#3b82f6' : '#ccc',
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
                          background: 'white',
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
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      fontSize: '0.875rem',
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
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    />
                    <p style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#666',
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
                    background: pluginMutation.isPending ? '#ccc' : '#10b981',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: pluginMutation.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {pluginMutation.isPending ? '保存中...' : '保存插件配置'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>暂无可用插件</p>
        )}
      </div>
    </div>
  );
}
