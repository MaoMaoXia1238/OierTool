# OierTool

算法竞赛选手的随身工具站 · [oiertool.cn](https://oiertool.cn)

OierTool 是一个开源的算法竞赛日历工具站，**自动聚合 Codeforces、AtCoder、LeetCode、洛谷、牛客 5 个主流 OJ 平台的竞赛数据**，提供统一的日历展示、智能倒计时和 REST API 接口。

## 核心功能

- **竞赛日历** — 自动聚合 5 大平台竞赛数据，统一日历展示 + 实时倒计时 + 平台筛选 + 历史归档
- **iCal 日历订阅** — 一键订阅到 Google Calendar / Outlook / 苹果日历，比赛自动同步
- **Web Push 比赛提醒** — 浏览器通知，比赛开始前 15 分钟自动提醒（免注册，一键开启，浏览器后台运行即可收到）
- **REST API** — 获取竞赛数据（平台/状态筛选、数量限制）与健康检查接口
- **定时爬虫** — 每日 08:00（北京时间）自动同步各平台竞赛信息，自动清理过期数据
- **暗色模式** — 跟随系统主题，支持手动切换并持久化
- **Docker 自托管** — docker-compose 一键部署 web + crawler + PostgreSQL

## 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | Next.js 16 (App Router) + React 19 |
| **样式方案** | Tailwind CSS v4 + shadcn/ui (base-nova) |
| **数据库** | PostgreSQL + Prisma 7 (ORM) |
| **爬虫引擎** | Playwright (无头浏览器) + axios + cheerio |
| **测试** | Vitest + React Testing Library + Playwright (E2E) |
| **CI/CD** | GitHub Actions（lint + 类型检查 + 测试 + Vercel 部署） |
| **包管理** | npm workspaces (monorepo) |
| **语言** | TypeScript (strict mode) |

## 项目结构

```
OierTool/
├── web/                  # Next.js 前端 + API
│   ├── app/              # 页面与 API 路由
│   ├── components/       # UI 组件
│   ├── lib/              # 工具库（DTO、环境校验、Prisma 单例）
│   └── prisma/           # schema + 数据库迁移
├── crawler/              # 竞赛数据爬虫
│   ├── spiders/          # 各平台爬虫（Codeforces/AtCoder/Luogu/NowCoder/LeetCode）
│   ├── crawl.ts          # 多平台爬取编排（并行 + 单平台容错）
│   ├── pipeline.ts       # 数据清洗管道（批量写入 + 唯一约束去重）
│   └── scheduler.ts      # 定时调度器（每日 08:00 北京时间）
├── tests/                # 单元测试 / E2E 测试 / fixtures
├── prisma/               # Prisma 生成的 Client
└── prisma.config.ts      # Prisma CLI 配置（迁移命令读取）
```

## 快速开始

### 前置要求

- Node.js 22+
- PostgreSQL 14+（本地安装，或使用 Docker，见下文）

### 本地开发（推荐：Docker 数据库）

```bash
# 1. 启动 PostgreSQL 容器（端口 5433，避免与本机 5432 冲突）
docker run -d --name oiertool-postgres --restart unless-stopped \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=oiertool -p 5433:5432 postgres:18-alpine

# 2. 安装依赖
npm install

# 3. 配置环境变量（复制示例文件并填写）
cp .env.example .env            # 根目录（Prisma CLI 使用）
cp web/.env.example web/.env    # Web 应用使用
cp crawler/.env.example crawler/.env

# 4. 初始化数据库
npx prisma migrate deploy

# 5. 启动开发服务器
npm run dev -w web              # http://localhost:3000

# 6. （可选）手动抓取一次竞赛数据
npm run crawl -w crawler
```

### 常用脚本

```bash
npm run check       # 全量检查：typecheck + lint + test
npm run typecheck   # TypeScript 类型检查（web + crawler）
npm run lint        # ESLint 代码检查（web + crawler）
npm test            # Vitest 单元测试（web + crawler）
npm run build -w web        # Web 生产构建
npm run crawl -w crawler    # 手动执行一次全平台爬取
```

## API

### `GET /api/contests` — 竞赛列表

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `platform` | string | 否 | 按平台筛选：`Codeforces` / `AtCoder` / `Luogu` / `NowCoder` / `LeetCode` |
| `status` | string | 否 | `upcoming`（默认，未开始）/ `ongoing`（进行中）/ `finished`（已结束，倒序） |
| `limit` | number | 否 | 返回数量上限，1-500，默认 100 |

### `GET /api/calendar.ics` — iCal 日历订阅

生成 RFC 5545 格式日历，支持 `?platform=` 单平台订阅。订阅方式：
1. 点击竞赛日历页「订阅日历」按钮复制链接
2. 在 Google Calendar / Outlook / 苹果日历中「添加日历 → 通过 URL 订阅」

### `GET /api/healthz` — 健康检查

返回数据库连通性、最近爬虫执行时间（`crawlAlive`），供容器健康检查与监控使用。

响应带 CDN 缓存头（5 分钟 + stale-while-revalidate）。完整文档见站内 [API 文档](https://oiertool.cn/docs)。

## 部署

- **Web 前端**：GitHub Actions 自动部署至 Vercel（推送 `main` 触发）
- **定时爬虫**：GitHub Actions 定时任务每日 3 次执行
- **比赛提醒**：独立 GitHub Actions 定时任务每 15 分钟检查一次待提醒比赛
- **Docker 自托管**：国内服务器可用 `docker compose up -d --build` 一键部署 web + crawler + PostgreSQL（爬虫容器内置 node-cron，每日 08:00 北京时间自动爬取）

## License

[MIT](LICENSE)
