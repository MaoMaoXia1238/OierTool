/**
 * 竞赛日历页面
 * 竞赛日历核心页面，集成 API 数据获取、平台筛选和比赛列表展示。
 * 使用客户端组件实现筛选交互。
 */
"use client";

import { useEffect, useState } from "react";
import { ContestList } from "@/components/ContestList";
import type { ContestData } from "@/components/ContestCard";

/**
 * 竞赛日历页面组件
 * 从 API 获取竞赛数据，支持按平台筛选
 * 平台筛选按钮根据数据中实际存在的平台动态生成。
 */
export default function CalendarPage() {
  const [contests, setContests] = useState<ContestData[]>([]); // 所有比赛数据
  const [filtered, setFiltered] = useState<ContestData[]>([]); // 筛选后的数据
  const [activePlatform, setActivePlatform] = useState<string>("全部"); // 当前选中平台
  const [loading, setLoading] = useState(true); // 加载状态

  // 页面加载时获取竞赛数据
  useEffect(() => {
    async function fetchContests() {
      setLoading(true);
      try {
        const res = await fetch("/api/contests");
        const data: ContestData[] = await res.json();
        setContests(data);
        setFiltered(data);
      } catch (err) {
        console.error("获取竞赛数据失败:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContests();
  }, []);

  // 从比赛数据中提取所有不重复的平台，按字典序排列
  const platforms = [
    "全部",
    ...[...new Set(contests.map((c) => c.platform))].sort(),
  ];

  // 平台筛选变化时更新显示
  useEffect(() => {
    if (activePlatform === "全部") {
      setFiltered(contests);
    } else {
      setFiltered(
        contests.filter((c) => c.platform === activePlatform)
      );
    }
  }, [activePlatform, contests]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 页面标题 */}
      <h1 className="mb-6 text-3xl font-bold">竞赛日历</h1>

      {/* 平台筛选 Tab */}
      <div className="mb-6 flex gap-2">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activePlatform === platform
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* 比赛列表 */}
      <ContestList contests={filtered} loading={loading} />
    </div>
  );
}
