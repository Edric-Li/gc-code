-- 删除非 Anthropic 的 AI 提供商（如果没有关联的渠道）
DELETE FROM "AiProvider"
WHERE slug != 'anthropic'
AND id NOT IN (SELECT DISTINCT "providerId" FROM "Channel" WHERE "providerId" IS NOT NULL);
