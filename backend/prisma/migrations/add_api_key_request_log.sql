-- CreateTable: API Key 详细请求日志
CREATE TABLE "api_key_request_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "api_key_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" UUID,
    "request_id" VARCHAR(255) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cache_creation_input_tokens" INTEGER,
    "cache_read_input_tokens" INTEGER,
    "duration" INTEGER NOT NULL,
    "time_to_first_token" INTEGER,
    "cost" DECIMAL(12,4) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "error_type" VARCHAR(50),
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "api_key_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_request_logs_request_id_key" ON "api_key_request_logs"("request_id");

-- CreateIndex
CREATE INDEX "idx_request_log_key_time" ON "api_key_request_logs"("api_key_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_request_log_user_time" ON "api_key_request_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_request_log_channel_time" ON "api_key_request_logs"("channel_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_request_log_model" ON "api_key_request_logs"("model");

-- CreateIndex
CREATE INDEX "idx_request_log_success" ON "api_key_request_logs"("success");

-- CreateIndex
CREATE INDEX "idx_request_log_created_at" ON "api_key_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_request_log_request_id" ON "api_key_request_logs"("request_id");

-- AddForeignKey
ALTER TABLE "api_key_request_logs" ADD CONSTRAINT "api_key_request_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_request_logs" ADD CONSTRAINT "api_key_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_request_logs" ADD CONSTRAINT "api_key_request_logs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
