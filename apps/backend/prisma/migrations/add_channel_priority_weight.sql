-- 为 Channel 表添加 priority 和 weight 字段

ALTER TABLE "Channel"
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "weight" INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN "Channel"."priority" IS '优先级（1-10，数字越小优先级越高）';
COMMENT ON COLUMN "Channel"."weight" IS '权重（用于负载均衡，数字越大权重越高）';
