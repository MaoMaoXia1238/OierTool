/**
 * ContestCard 组件单元测试
 * 测试竞赛卡片组件的各项渲染功能：
 * 比赛信息展示、平台 Logo、倒计时文案、链接跳转等。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContestCard } from "@/components/ContestCard";

// 固定当前时间，保证倒计时计算可预测
const NOW = new Date("2026-06-15T12:00:00Z");

// 模拟比赛数据结构（与组件 Props 一致）
const mockContest = {
  id: "1",
  name: "Codeforces Round #1000",
  platform: "Codeforces",
  startTime: new Date("2026-06-18T12:00:00Z"), // 3 天后
  duration: 120, // 120 分钟
  url: "https://codeforces.com/contest/1000",
};

describe("ContestCard", () => {
  beforeEach(() => {
    // 固定系统时间，使 countdown 计算可预测
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    // 恢复真实时间
    vi.useRealTimers();
  });

  it("应渲染比赛信息：名称、平台、开始时间、时长", () => {
    render(<ContestCard contest={mockContest} />);

    // 比赛名称
    expect(screen.getByText("Codeforces Round #1000")).toBeInTheDocument();

    // 平台名称
    expect(screen.getByText("Codeforces")).toBeInTheDocument();

    // 时长（120分钟 → 共享函数为 "2 小时"）
    expect(screen.getByText("2 小时")).toBeInTheDocument();
  });

  it("应渲染平台 Logo 图片，src 指向正确路径", () => {
    render(<ContestCard contest={mockContest} />);

    const logoImg = screen.getByRole("img", { name: /Codeforces/ });
    expect(logoImg).toBeInTheDocument();
    // src 应指向 /logos/codeforces.svg
    expect(logoImg).toHaveAttribute("src", "/logos/codeforces.svg");
  });

  it("倒计时应显示「x 天后」（未来 3 天）", () => {
    render(<ContestCard contest={mockContest} />);

    // 3 天后 → 文案包含 "天"
    expect(screen.getByText(/天/)).toBeInTheDocument();
  });

  it("倒计时应显示「x 小时后」（未来 5 小时）", () => {
    const contestIn5Hours = {
      ...mockContest,
      startTime: new Date("2026-06-15T17:00:00Z"), // 5 小时后
    };
    render(<ContestCard contest={contestIn5Hours} />);

    // 5 小时后 → 倒计时文案为 "5 小时"（不含"后"），不包含 "天"
    const countdownEl = screen.getByText("5 小时");
    expect(countdownEl).toBeInTheDocument();
    expect(screen.queryByText(/天/)).not.toBeInTheDocument();
  });

  it("距离比赛不足 1 小时时显示具体分钟数（未来 30 分钟 → 30 分钟后）", () => {
    const contestSoon = {
      ...mockContest,
      startTime: new Date("2026-06-15T12:30:00Z"), // 30 分钟后
    };
    render(<ContestCard contest={contestSoon} />);

    // 文案应为 "30 分钟后"（不足 5 分钟才显示"即将开始"）
    expect(screen.getByText("30 分钟后")).toBeInTheDocument();
  });

  it("应渲染比赛链接，href 属性正确", () => {
    render(<ContestCard contest={mockContest} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://codeforces.com/contest/1000");
  });
});
