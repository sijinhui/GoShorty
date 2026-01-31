-- 修改 links 表结构
-- 1. 删除 expires_at 字段（过期信息已迁移到 link_expiry 表）
ALTER TABLE links DROP COLUMN IF EXISTS expires_at;

-- 2. 添加 created_ip 字段（记录创建链接时的 IP 地址）
ALTER TABLE links ADD COLUMN IF NOT EXISTS created_ip VARCHAR(45);

-- 创建索引以便按 IP 查询
CREATE INDEX IF NOT EXISTS idx_links_created_ip ON links(created_ip);
