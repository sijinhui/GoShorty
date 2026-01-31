-- 插件配置迁移
-- 添加插件相关的配置到 settings 表

-- 插入7天过期插件配置
INSERT INTO settings (key, value, description)
VALUES
    ('plugin.seven_day_expiry.enabled', 'true', '7天过期插件是否启用'),
    ('plugin.seven_day_expiry.days', '7', '默认过期天数（1-365天）')
ON CONFLICT (key) DO NOTHING;
