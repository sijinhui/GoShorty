-- 将 country 列从 VARCHAR(2) 扩大到 VARCHAR(100)
-- 原 VARCHAR(2) 仅能存储 ISO 3166-1 alpha-2 代码，
-- 但 GeoIP 解析器可能返回 "Unknown"、"Local" 等描述性值，导致 INSERT 失败
ALTER TABLE access_logs ALTER COLUMN country TYPE VARCHAR(100);
