-- Add TEMP_ERROR to ChannelStatus enum
ALTER TYPE "ChannelStatus" ADD VALUE IF NOT EXISTS 'TEMP_ERROR';
