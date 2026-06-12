# OierTool - 算法竞赛选手工具站

一个面向算法竞赛（OI/ACM/ICPC）选手的全栈工具网站，提供竞赛日历、数据聚合等实用功能。

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 全栈框架 | **Next.js 14+**（App Router） | 统一前后端，React + API Routes 一体 |
| 前端 UI | React 18 + TypeScript + shadcn/ui | — |
| ORM | **Prisma** | 类型安全，与 Next.js + PostgreSQL 生态无缝衔接 |
| 数据库 | **PostgreSQL** | 生产环境使用 Supabase / Neon 等云服务 |
| 爬虫 | **Node.js** + Cheerio + Axios | 与主项目语言统一，静态页面解析 |
| 定时调度 | **node-cron** | 爬虫进程内定时执行，每日自动抓取 |
| 主项目部署 | **Vercel** | Next.js 一键部署，零配置 CI/CD |
| 爬虫部署 | **Railway** | 独立部署，支持长时间运行与定时任务 |
| 测试 | **Vitest** + React Testing Library + **Playwright** | TDD 驱动开发，单元 / 集成 / E2E 全覆盖 |

## 核心功能

### 1. 竞赛日历（已规划）

- 通过爬虫程序定时爬取 Codeforces 和洛谷的竞赛数据
- 汇总展示近期线上竞赛，包含竞赛名称、时间、平台、难度等级等信息
- 支持按平台、时间范围筛选，支持一键添加到系统日历

### 2. 后续规划

- **Web 代码编辑器**：提供在线代码运行服务，支持多语言（C++/Python/Java 等），方便选手快速测试代码
- **微信公众号服务**：推出微信公众号，通过公众号接口查询竞赛日历，随时随地获取竞赛信息
- 个人竞赛记录与战绩追踪
- 题目推荐与难度分析
- 队内训练管理
- 算法知识图谱

## 项目结构

```
OierTool/
├── web/                        # Next.js 主项目（Vercel 部署）
│   ├── app/
│   │   ├── page.tsx            # 首页
│   │   ├── calendar/           # 竞赛日历页面
│   │   ├── api/
│   │   │   └── contests/       # 竞赛数据 API
│   │   └── layout.tsx
│   ├── components/             # UI 组件
│   ├── lib/                    # 工具函数 + Prisma 客户端
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型
│   ├── package.json
│   └── next.config.ts
├── crawler/                    # Node.js 爬虫模块（Railway 部署）
│   ├── spiders/
│   │   ├── codeforces.ts       # Codeforces 爬虫
│   │   └── luogu.ts            # 洛谷爬虫
│   ├── scheduler.ts            # 定时任务（node-cron）
│   ├── pipeline.ts             # 数据清洗与写入 PostgreSQL
│   └── package.json
├── tests/                      # 统一测试目录（与业务代码分离）
│   ├── web/
│   │   ├── components/         # 组件测试（Vitest + RTL）
│   │   ├── api/                # API Routes 集成测试
│   │   └── lib/                # 工具函数 / Prisma 操作测试
│   ├── crawler/                # 爬虫解析测试
│   ├── e2e/                    # Playwright E2E 测试
│   └── fixtures/               # 爬虫测试用 HTML 快照
└── README.md
```

### 架构说明

```
┌────────────────────────────────────┐
│  Vercel                            │
│  ┌──────────────┐ ┌──────────────┐ │
│  │  前端页面      │ │  API Routes │ │
│  │  (竞赛日历 UI) │ │  (读数据库)   │ │
│  └──────────────┘ └──────┬───────┘ │
└──────────────────────────┼─────────┘
                           │ 读取
                    ┌──────▼──────┐
                    │  PostgreSQL │  ← 共享数据库
                    └──────▲──────┘
                           │ 写入
┌──────────────────────────┼─────────┐
│  Railway                │         │
│  ┌──────────────────────┴───────┐ │
│  │  爬虫（node-cron 定时执行）   │ │
│  │  每日自动抓取 → 清洗 → 写入   │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## 测试

项目采用 **测试驱动开发（TDD）**，严格执行"写测试 → 写实现 → 重构"循环。

### 测试金字塔

```
         /\
        /E2E\          少而精，模拟真实用户操作
       /------\
      / 集成测试 \      中等数量，验证模块间协作
     /------------\
    /   单元测试    \    数量最多，验证单一函数/组件
   /________________\
```

### 测试层级与工具

| 层级 | 工具 | 说明 | 示例场景 |
|------|------|------|---------|
| 单元测试 | **Vitest** + React Testing Library | 函数、组件独立验证 | 日期格式化、ContestCard 渲染 |
| 集成测试 | **Vitest** + 测试数据库 | API + 数据库完整链路 | `GET /api/contests` 返回筛选结果 |
| E2E 测试 | **Playwright** | 模拟浏览器用户操作 | 打开页面 → 筛选平台 → 查看竞赛详情 |

### TDD 开发流程

```
功能开发 → 写测试（红灯）→ 写实现（绿灯）→ 重构（保持绿灯）→ 下一功能

示例：开发竞赛日历页
  1. 写 ContestCard 组件测试（渲染空数据 → 红灯）
  2. 实现 ContestCard 组件（绿灯）
  3. 写 API 测试（红灯）
  4. 实现 GET /api/contests（绿灯）
  5. 写 Calendar 页面集成测试（红灯）
  6. 组装完成（绿灯）
```

### 运行测试

```bash
# Web 主项目测试
cd web
npx vitest              # 运行单元测试
npx vitest --coverage   # 含覆盖率报告

# 爬虫测试
cd crawler
npx vitest              # 解析逻辑测试

# E2E 测试
npx playwright test     # 模拟用户完整操作
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14（本地开发）

### 本地开发

```bash
# 克隆项目
git clone <repo-url>
cd OierTool

# 启动 Next.js 主项目
cd web
cp .env.example .env      # 配置数据库连接
npm install
npx prisma db push        # 初始化数据库表
npm run dev               # http://localhost:3000

# 启动爬虫（另一个终端，手动触发一次）
cd crawler
cp .env.example .env
npm install
npx tsx scheduler.ts
```

## 数据源

爬虫覆盖的竞赛平台：

- [Codeforces](https://codeforces.com/) — 全球最大算法竞赛平台
- [洛谷](https://www.luogu.com.cn/) — 国内最大 OI 社区

> 后续将逐步扩展支持 AtCoder、牛客、LeetCode 等平台。

## CI/CD

项目接入 GitHub Actions，每次 Push / PR 自动执行测试：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: |
          cd web && npm ci && npx prisma db push && npx vitest --coverage
          cd ../crawler && npm ci && npx vitest
      - run: npx playwright test
```

## License

MIT
