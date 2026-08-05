-- 竞赛提醒发送标记：记录该比赛是否已发送过 Web Push 提醒，避免重复推送
ALTER TABLE "contests" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
