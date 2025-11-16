-- Remove Channel Groups functionality
-- This migration removes the channel groups feature, keeping only CHANNEL and PROVIDER target types

-- Step 1: Remove channel_group_id column from api_keys table
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "channel_group_id";

-- Step 2: Drop the channel_group_members table
DROP TABLE IF EXISTS "channel_group_members";

-- Step 3: Drop the channel_groups table
DROP TABLE IF EXISTS "channel_groups";

-- Step 4: Update the ChannelTargetType enum to remove GROUP
-- First, update any existing records that use GROUP (if any)
-- Use text conversion to handle cases where GROUP value doesn't exist in enum yet
UPDATE "api_keys" SET "channel_target_type" = 'CHANNEL' WHERE "channel_target_type"::text = 'GROUP';

-- Then recreate the enum type
-- PostgreSQL doesn't support removing values from enums directly, so we need to:
-- 1. Create a new enum type with the desired values
CREATE TYPE "ChannelTargetType_new" AS ENUM ('CHANNEL', 'PROVIDER');

-- 2. Alter the column to use the new type
ALTER TABLE "api_keys"
  ALTER COLUMN "channel_target_type" TYPE "ChannelTargetType_new"
  USING ("channel_target_type"::text::"ChannelTargetType_new");

-- 3. Drop the old enum type
DROP TYPE "ChannelTargetType";

-- 4. Rename the new type to the original name
ALTER TYPE "ChannelTargetType_new" RENAME TO "ChannelTargetType";

-- Step 5: Remove the index on channel_group_id (if it exists)
DROP INDEX IF EXISTS "idx_api_keys_channel_group_id";

-- Done: Channel groups functionality has been removed
-- API Keys now only support CHANNEL and PROVIDER target types
