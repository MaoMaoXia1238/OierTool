/**
 * OierTool - API 文档页面
 * 展示后端接口的使用方法，包含接口地址、请求方式、参数说明、响应示例和错误码。
 * 帮助开发者快速接入 OierTool API。
 */
"use client";

/** API 接口文档数据 */
const API_ENDPOINTS = [
  {
    path: "/api/contests",
    method: "GET",
    description: "返回即将到来的竞赛列表",
    params: [
      { name: "platform", type: "string", required: false, description: "按平台筛选，可选值：\"Codeforces\"、\"Luogu\"" },
    ],
    successExample: `[
  {
    "id": "clx...",
    "name": "Codeforces Round #1000",
    "platform": "Codeforces",
    "startTime": "2026-06-18T12:00:00.000Z",
    "endTime": "2026-06-18T14:00:00.000Z",
    "duration": 120,
    "url": "https://codeforces.com/contest/1000",
    "createdAt": "2026-06-12T09:13:33.635Z",
    "updatedAt": "2026-06-12T09:13:33.635Z"
  }
]`,
    errorExample: '{ "error": "Internal Server Error" }',
    errorStatus: 500,
  },
];

/** 响应字段说明 */
const RESPONSE_FIELDS = [
  { name: "id", type: "string", description: "竞赛唯一标识 ID" },
  { name: "name", type: "string", description: "竞赛名称" },
  { name: "platform", type: "string", description: "竞赛平台，如 Codeforces、Luogu" },
  { name: "startTime", type: "string (ISO 8601)", description: "竞赛开始时间" },
  { name: "endTime", type: "string (ISO 8601)", description: "竞赛结束时间" },
  { name: "duration", type: "number", description: "竞赛时长（分钟）" },
  { name: "url", type: "string", description: "竞赛链接" },
  { name: "createdAt", type: "string (ISO 8601)", description: "数据创建时间" },
  { name: "updatedAt", type: "string (ISO 8601)", description: "数据更新时间" },
];

/**
 * 代码块组件
 * 使用 pre + code 标签展示代码示例，带灰色背景
 */
function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-relaxed">
      <code className={`language-${language} text-muted-foreground`}>{code}</code>
    </pre>
  );
}

/**
 * 区块标题组件
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xl font-semibold tracking-tight">{children}</h2>
  );
}

/**
 * API 文档页面组件
 */
export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* 页面标题 */}
      <h1 className="mb-2 text-3xl font-bold tracking-tight">API 文档</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        OierTool 提供 RESTful API 接口，方便开发者获取竞赛数据。
      </p>

      {API_ENDPOINTS.map((endpoint) => (
        <section key={endpoint.path} className="space-y-10">
          {/* 接口地址 */}
          <section>
            <SectionTitle>接口地址</SectionTitle>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {endpoint.method}
              </span>
              <code className="text-sm font-mono font-semibold">{endpoint.path}</code>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{endpoint.description}</p>
          </section>

          {/* 请求方式 */}
          <section>
            <SectionTitle>请求方式</SectionTitle>
            <div className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 shadow-sm">
              <span className="rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                {endpoint.method}
              </span>
              <span className="text-sm text-muted-foreground">HTTP 请求</span>
            </div>
          </section>

          {/* 参数说明 */}
          <section>
            <SectionTitle>参数说明</SectionTitle>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">参数名</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">类型</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">必填</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {endpoint.params.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        无参数
                      </td>
                    </tr>
                  ) : (
                    endpoint.params.map((param) => (
                      <tr key={param.name} className="transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3 font-mono text-sm font-medium">{param.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{param.type}</td>
                        <td className="px-5 py-3">
                          {param.required ? (
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                              是
                            </span>
                          ) : (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              否
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{param.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* 筛选示例 */}
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium text-muted-foreground">筛选示例：</p>
              <CodeBlock code={`GET ${endpoint.path}?platform=Codeforces`} language="http" />
            </div>
          </section>

          {/* 响应字段说明 */}
          <section>
            <SectionTitle>响应字段说明</SectionTitle>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">字段名</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">类型</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {RESPONSE_FIELDS.map((field) => (
                    <tr key={field.name} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-sm font-medium">{field.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{field.type}</td>
                      <td className="px-5 py-3 text-muted-foreground">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 响应示例 */}
          <section>
            <SectionTitle>成功响应示例</SectionTitle>
            <CodeBlock code={endpoint.successExample} />
          </section>

          {/* 错误码 */}
          <section>
            <SectionTitle>错误码</SectionTitle>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">状态码</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">说明</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">响应体</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {endpoint.errorStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">服务器内部错误</td>
                    <td className="px-5 py-3">
                      <CodeBlock code={endpoint.errorExample} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ))}
    </main>
  );
}
