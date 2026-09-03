-- AlterTable
ALTER TABLE "follow_ups" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "channel_attempts" JSONB,
ADD COLUMN     "next_retry_at" TIMESTAMPTZ(6);
