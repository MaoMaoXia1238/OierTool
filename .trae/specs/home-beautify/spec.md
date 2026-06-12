# 首页美化与竞赛日历入口 Spec

## Why
当前首页仅显示一个居中的标题文字，缺乏视觉吸引力和导航入口。用户需要从首页快速进入竞赛日历页面查看即将到来的比赛。

## What Changes
- 美化首页设计：添加赛事相关的视觉元素（图标、渐变背景等）
- 首页增加"查看竞赛日历"按钮，点击跳转到 `/calendar` 页面
- 竞赛日历页面已存在，无需新建

## Impact
- Affected specs: 首页 (home), 竞赛日历 (calendar)
- Affected code: `web/app/page.tsx`, `web/app/globals.css`

## ADDED Requirements

### Requirement: 首页美化展示
系统应在首页展示 OierTool 的品牌标识、项目简介、以及导航入口。

#### Scenario: 用户访问首页
- **WHEN** 用户打开 `http://localhost:3000/`
- **THEN** 首页显示带有图标/装饰的品牌标题"OierTool"
- **AND** 显示副标题简介"算法竞赛工具站"
- **AND** 布局居中且垂直排列

### Requirement: 竞赛日历入口按钮
系统应在首页提供一个醒目按钮，引导用户进入竞赛日历页面。

#### Scenario: 用户点击竞赛日历按钮
- **WHEN** 用户在首页点击"查看竞赛日历"按钮
- **THEN** 浏览器导航到 `/calendar` 页面
- **AND** 显示平台筛选 Tab 和比赛列表
