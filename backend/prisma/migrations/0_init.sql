-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('AZURE_AD', 'GOOGLE', 'GITHUB', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('LOCAL', 'AZURE_AD', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('DEPARTMENT', 'PROJECT_GROUP', 'TEAM', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "KeyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'DELETED');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'AZURE_OPENAI', 'GOOGLE_AI', 'KIMI', 'DEEPSEEK', 'BAIDU', 'ALIBABA', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "display_name" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "display_name" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "login_method" "LoginMethod" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(255),
    "description" TEXT,
    "changes" JSONB,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "method" "HttpMethod" NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "request_body" JSONB,
    "response_body" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'DEPARTMENT',
    "parent_id" UUID,
    "description" TEXT,
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "channel_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "key" VARCHAR(255) NOT NULL,
    "daily_cost_limit" DECIMAL(12,2),
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" "KeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_providers" (
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
CREATE TABLE "channels" (
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
CREATE TABLE "channel_models" (
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
CREATE TABLE "channel_usage" (
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
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_provider" ON "oauth_accounts"("provider");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_user_id" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_user_id_provider_key" ON "oauth_accounts"("user_id", "provider");

-- CreateIndex
CREATE INDEX "idx_login_logs_user_id" ON "login_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_login_logs_created_at" ON "login_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_login_logs_success" ON "login_logs"("success");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "idx_api_logs_user_id" ON "api_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_api_logs_created_at" ON "api_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_api_logs_path" ON "api_logs"("path");

-- CreateIndex
CREATE INDEX "idx_api_logs_status_code" ON "api_logs"("status_code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_slug" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_name" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "idx_organizations_parent_id" ON "organizations"("parent_id");

-- CreateIndex
CREATE INDEX "idx_organizations_type" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "idx_org_members_org_id" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_members_user_id" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "idx_api_keys_user_id" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "idx_api_keys_channel_id" ON "api_keys"("channel_id");

-- CreateIndex
CREATE INDEX "idx_api_keys_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "idx_api_keys_status" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "idx_api_keys_expires_at" ON "api_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idx_api_keys_deleted_at" ON "api_keys"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_api_key_usage_key_id" ON "api_key_usage"("key_id");

-- CreateIndex
CREATE INDEX "idx_api_key_usage_user_id" ON "api_key_usage"("user_id");

-- CreateIndex
CREATE INDEX "idx_api_key_usage_period_start" ON "api_key_usage"("period_start");

-- CreateIndex
CREATE INDEX "idx_api_key_usage_created_at" ON "api_key_usage"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_usage_key_id_period_start_key" ON "api_key_usage"("key_id", "period_start");

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

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_models" ADD CONSTRAINT "channel_models_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_usage" ADD CONSTRAINT "channel_usage_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

