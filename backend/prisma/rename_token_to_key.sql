-- Rename migration: api_tokens -> api_keys
-- This script renames tables and columns while preserving data

-- 1. Rename the enum type
ALTER TYPE "TokenStatus" RENAME TO "KeyStatus";

-- 2. Rename the api_tokens table
ALTER TABLE "api_tokens" RENAME TO "api_keys";

-- 3. Rename the token column to key in api_keys table
ALTER TABLE "api_keys" RENAME COLUMN "token" TO "key";

-- 4. Rename the api_token_usage table
ALTER TABLE "api_token_usage" RENAME TO "api_key_usage";

-- 5. Rename the token_id column to key_id in api_key_usage table
ALTER TABLE "api_key_usage" RENAME COLUMN "token_id" TO "key_id";

-- 6. Rename indexes
ALTER INDEX "idx_api_tokens_user_id" RENAME TO "idx_api_keys_user_id";
ALTER INDEX "idx_api_tokens_token" RENAME TO "idx_api_keys_key";
ALTER INDEX "idx_api_tokens_status" RENAME TO "idx_api_keys_status";
ALTER INDEX "idx_api_tokens_expires_at" RENAME TO "idx_api_keys_expires_at";
ALTER INDEX "idx_api_tokens_deleted_at" RENAME TO "idx_api_keys_deleted_at";

ALTER INDEX "idx_api_token_usage_token_id" RENAME TO "idx_api_key_usage_key_id";
ALTER INDEX "idx_api_token_usage_user_id" RENAME TO "idx_api_key_usage_user_id";
ALTER INDEX "idx_api_token_usage_period_start" RENAME TO "idx_api_key_usage_period_start";
ALTER INDEX "idx_api_token_usage_created_at" RENAME TO "idx_api_key_usage_created_at";

-- 7. Rename unique constraint
ALTER TABLE "api_key_usage" DROP CONSTRAINT "api_token_usage_token_id_period_start_key";
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_key_id_period_start_key" UNIQUE ("key_id", "period_start");

-- 8. Rename foreign key constraints
ALTER TABLE "api_keys" DROP CONSTRAINT "api_tokens_user_id_fkey";
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_key_usage" DROP CONSTRAINT "api_token_usage_token_id_fkey";
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_key_usage" DROP CONSTRAINT "api_token_usage_user_id_fkey";
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
