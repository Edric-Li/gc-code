-- 移除 Channel 表的高级配置字段

-- 移除 API 版本字段
ALTER TABLE "channels" DROP COLUMN IF EXISTS "api_version";

-- 移除限流配置字段
ALTER TABLE "channels" DROP COLUMN IF EXISTS "max_requests_per_min";
ALTER TABLE "channels" DROP COLUMN IF EXISTS "max_concurrent";
ALTER TABLE "channels" DROP COLUMN IF EXISTS "timeout";

-- 移除负载均衡配置字段
ALTER TABLE "channels" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "channels" DROP COLUMN IF EXISTS "weight";
