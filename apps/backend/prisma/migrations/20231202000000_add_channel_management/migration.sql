-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "channel_id" UUID;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "type" "ProviderType" NOT NULL DEFAULT 'CUSTOM',
    "logo_url" VARCHAR(500),
    "website" VARCHAR(500),
    "description" TEXT,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "base_url" VARCHAR(500) NOT NULL,
    "api_key" TEXT NOT NULL,
    "api_version" VARCHAR(50),
    "status" "ChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "max_requests_per_min" INTEGER,
    "max_concurrent" INTEGER,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "last_health_check" TIMESTAMP(3),
    "health_status" VARCHAR(50),
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "channel_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel_id" UUID NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "model_key" VARCHAR(100),
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "channel_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel_id" UUID NOT NULL,
    "api_key_id" UUID NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "total_latency" INTEGER NOT NULL DEFAULT 0,
    "avg_latency" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "channel_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_slug_key" ON "ai_providers"("slug");

-- CreateIndex
CREATE INDEX "idx_ai_providers_slug" ON "ai_providers"("slug");

-- CreateIndex
CREATE INDEX "idx_ai_providers_type" ON "ai_providers"("type");

-- CreateIndex
CREATE INDEX "idx_ai_providers_is_active" ON "ai_providers"("is_active");

-- CreateIndex
CREATE INDEX "idx_channels_provider_id" ON "channels"("provider_id");

-- CreateIndex
CREATE INDEX "idx_channels_status" ON "channels"("status");

-- CreateIndex
CREATE INDEX "idx_channels_deleted_at" ON "channels"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_channel_models_channel_id" ON "channel_models"("channel_id");

-- CreateIndex
CREATE INDEX "idx_channel_models_model_name" ON "channel_models"("model_name");

-- CreateIndex
CREATE UNIQUE INDEX "channel_models_channel_id_model_name_key" ON "channel_models"("channel_id", "model_name");

-- CreateIndex
CREATE INDEX "idx_channel_usage_channel_id" ON "channel_usage"("channel_id");

-- CreateIndex
CREATE INDEX "idx_channel_usage_api_key_id" ON "channel_usage"("api_key_id");

-- CreateIndex
CREATE INDEX "idx_channel_usage_period_start" ON "channel_usage"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "channel_usage_channel_id_api_key_id_period_start_key" ON "channel_usage"("channel_id", "api_key_id", "period_start");

-- CreateIndex
CREATE INDEX "idx_api_keys_channel_id" ON "api_keys"("channel_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_models" ADD CONSTRAINT "channel_models_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_usage" ADD CONSTRAINT "channel_usage_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

