-- 添加比赛去重唯一约束：name + platform + startTime
-- 先清理潜在重复数据（保留 id 最小的一条），再创建唯一索引
DELETE FROM "contests" a
USING "contests" b
WHERE a."id" > b."id"
  AND a."name" = b."name"
  AND a."platform" = b."platform"
  AND a."startTime" = b."startTime";

CREATE UNIQUE INDEX "contests_name_platform_starttime_key" ON "contests" ("name", "platform", "startTime");
