-- 添加速率限制配置到设置表
INSERT INTO settings (key, value, description)
VALUES
    ('rate_limit.enabled', 'false', '是否启用速率限制'),
    ('rate_limit.requests_limit', '10', '时间窗口内允许的最大请求数'),
    ('rate_limit.window_minutes', '1', '速率限制时间窗口（分钟）')
ON CONFLICT (key) DO NOTHING;
