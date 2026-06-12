/**
 * ContestList 组件单元测试
 * 测试竞赛列表组件的渲染功能：
 * 多卡片列表渲染、空数据状态、加载状态。
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContestList } from "@/components/ContestList";

// 模拟比赛数据数组
const mockContests = [
  {
    id: "1",
    name: "Codeforces Round #1000",
    platform: "Codeforces",
    startTime: new Date("2026-06-18T12:00:00Z"),
    duration: 120,
    url: "https://codeforces.com/contest/1000",
  },
  {
    id: "2",
    name: "Luogu Monthly Contest",
    platform: "Luogu",
    startTime: new Date("2026-06-20T08:00:00Z"),
    duration: 180,
    url: "https://www.luogu.com.cn/contest/123",
  },
  {
    id: "3",
    name: "AtCoder Beginner Contest",
    platform: "Codeforces",
    startTime: new Date("2026-06-22T12:00:00Z"),
    duration: 100,
    url: "https://atcoder.jp/contests/abc300",
  },
];

describe("ContestList", () => {
  it("应渲染多个 ContestCard（3 条比赛数据 → 3 个卡片）", () => {
    render(<ContestList contests={mockContests} />);

    // 验证三个比赛名称都出现在页面中（tooltip 含同名文本，用 getAllByText）
    expect(screen.getAllByText("Codeforces Round #1000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Luogu Monthly Contest").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("AtCoder Beginner Contest").length).toBeGreaterThanOrEqual(1);
  });

  it("空数据状态：传入空数组，应显示「暂无比赛」", () => {
    render(<ContestList contests={[]} />);

    expect(screen.getByText(/暂无比赛/)).toBeInTheDocument();
  });

  it("加载状态：loading=true 时显示加载提示", () => {
    render(<ContestList contests={[]} loading={true} />);

    expect(screen.getByText(/加载中/)).toBeInTheDocument();
  });

  it("loading 与 空数据同时存在时，优先展示加载状态", () => {
    render(<ContestList contests={[]} loading={true} />);

    // 加载提示存在
    expect(screen.getByText(/加载中/)).toBeInTheDocument();
    // 不应同时显示空数据提示
    expect(screen.queryByText(/暂无比赛/)).not.toBeInTheDocument();
  });
});
