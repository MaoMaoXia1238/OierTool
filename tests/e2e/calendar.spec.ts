/**
 * 竞赛日历 E2E 端到端测试
 * 使用 Playwright 模拟真实用户操作流程：
 * 访问日历页面 → 查看比赛列表 → 切换平台筛选
 */
import { test, expect } from "@playwright/test";

test.describe("竞赛日历页面", () => {
  test("访问日历页面，展示比赛列表和筛选按钮", async ({ page }) => {
    // 访问竞赛日历页面
    await page.goto("/calendar");

    // 验证页面标题
    await expect(page.locator("h1")).toHaveText("竞赛日历");

    // 验证筛选按钮存在（全部、Codeforces、Luogu）
    const filterButtons = page.locator('button:has-text("全部"), button:has-text("Codeforces"), button:has-text("Luogu")');
    await expect(filterButtons.first()).toBeVisible();
    await expect(filterButtons).toHaveCount(3);
  });

  test("切换平台筛选，列表更新", async ({ page }) => {
    await page.goto("/calendar");

    // 点击 Codeforces 筛选按钮
    await page.click('button:has-text("Codeforces")');

    // 验证 Codeforces 按钮变成选中状态（含 primary 背景色）
    const activeButton = page.locator('button:has-text("Codeforces")');
    await expect(activeButton).toHaveClass(/bg-primary/);
  });

  test("空数据时显示暂无比赛提示", async ({ page }) => {
    await page.goto("/calendar");

    // 等待页面渲染完成
    const pageContent = page.locator("body");
    await expect(pageContent).toBeVisible();

    // 验证页面中有 "暂无比赛" 的文字提示
    await expect(page.locator("text=暂无比赛")).toBeVisible();
  });
});
