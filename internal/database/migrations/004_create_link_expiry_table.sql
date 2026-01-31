-- 创建链接过期表
CREATE TABLE IF NOT EXISTS link_expiry (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    lifecycle_days INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_link_expiry_short_code
        FOREIGN KEY (short_code)
        REFERENCES links(short_code)
        ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_link_expiry_short_code ON link_expiry(short_code);
CREATE INDEX IF NOT EXISTS idx_link_expiry_expires_at ON link_expiry(expires_at);

-- 迁移现有的过期数据（如果 links 表中有 expires_at 字段）
-- 注意：这个迁移假设 expires_at 字段还存在
INSERT INTO link_expiry (short_code, lifecycle_days, created_at, expires_at)
SELECT
    short_code,
    EXTRACT(DAY FROM (expires_at - created_at))::INTEGER as lifecycle_days,
    created_at,
    expires_at
FROM links
WHERE expires_at IS NOT NULL
ON CONFLICT (short_code) DO NOTHING;
