/**
 * OierTool - 首页组件
 * 展示品牌标识、项目简介和竞赛日历入口按钮。
 * 引导用户进入竞赛日历页面查看即将到来的比赛。
 */
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      {/* ----- 品牌标识区域 ----- */}
      <div className="flex flex-col items-center gap-3">
        {/* 赛事图标（奖杯 emoji + 渐变色徽章） */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl shadow-inner ring-1 ring-primary/20">
          🏆
        </div>

        {/* 标题 */}
        <h1 className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          OierTool
        </h1>

        {/* 副标题 */}
        <p className="text-lg font-medium text-muted-foreground">
          算法竞赛选手的随身工具站
        </p>

        {/* 提示文字 */}
        <p className="max-w-md text-sm text-muted-foreground/80">
          追踪 Codeforces、洛谷等平台的最新竞赛，一站式管理你的比赛日程
        </p>
      </div>

      {/* ----- 竞赛日历入口按钮 ----- */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
      >
        {/* 日历图标 */}
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
          />
        </svg>
        查看竞赛日历
      </Link>
    </main>
  );
}
