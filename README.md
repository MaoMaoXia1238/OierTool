# OierTool

算法竞赛选手的随身工具站 · [oiertool.cn](https://oiertool.cn)

OierTool 是一个开源的算法竞赛日历工具站，**自动聚合 Codeforces、AtCoder、LeetCode、洛谷、牛客 5 个主流 OJ 平台的竞赛数据**，提供统一的日历展示、智能倒计时和 REST API 接口。

## 核心功能

- **竞赛日历** — 自动聚合 Codeforces、AtCoder、LeetCode、洛谷、牛客 5 个平台的竞赛数据，提供统一的日历展示与查询接口。

## 后续规划

- **Web 代码编辑器** — 提供在线代码运行服务，支持 C++/Python/Java 等多语言，方便快速测试代码
- **微信公众号服务** — 推出微信公众号，通过公众号接口随时查询竞赛日历
- **个人竞赛记录与战绩追踪** — 记录参赛历史，分析成绩趋势
- **题目推荐与难度分析** — 根据个人水平智能推荐题目，助力高效训练

## 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | Next.js 16 (App Router) + React 19 |
| **样式方案** | Tailwind CSS v4 + shadcn/ui (base-nova) |
| **数据库** | PostgreSQL + Prisma 7 (ORM) |
| **爬虫引擎** | Playwright (无头浏览器) + axios + cheerio |
| **测试** | Vitest + React Testing Library + Playwright |
| **CI/CD** | GitHub Actions (测试 + Vercel 部署) |
| **包管理** | npm workspaces (monorepo) |
| **语言** | TypeScript (strict mode) |

## 快速开始

```bash
# 克隆项目
git clone https://github.com/MaoMaoXia1238/OierTool.git
cd OierTool

# 安装依赖
npm install

# 配置数据库连接（编辑 .env 中的 DATABASE_URL）
cp .env.example .env

# 初始化数据库
npx prisma migrate deploy

# 启动开发服务器
npm run dev -w web     # http://localhost:3000
```

## 项目结构

```
OierTool/
├── web/               # Next.js 前端 + API
├── crawler/           # 竞赛数据爬虫
├── tests/             # 单元测试 / E2E 测试
└── prisma/            # Prisma Client + 迁移文件
```

## License

[MIT](LICENSE)
