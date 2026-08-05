/**
 * 爬虫共享 HTTP 客户端
 * 统一设置 User-Agent、超时与重试策略，避免各爬虫重复配置且行为不一致。
 */

import axios, { type AxiosInstance } from "axios";

/** 默认请求超时（毫秒） */
const DEFAULT_TIMEOUT_MS = 15_000;

/** 默认重试次数（不含首次请求） */
const DEFAULT_RETRIES = 2;

/** 重试间隔基数（毫秒，指数退避） */
const RETRY_BASE_DELAY_MS = 1_000;

/** 浏览器 UA，降低被反爬拦截的概率 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** 延迟辅助函数 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建带超时/UA/重试的 axios 实例
 * @param options 可选配置（超时、重试次数、额外请求头）
 */
export function createHttpClient(options?: {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}): AxiosInstance {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? DEFAULT_RETRIES;

  const client = axios.create({
    timeout: timeoutMs,
    headers: {
      "User-Agent": BROWSER_UA,
      ...options?.headers,
    },
  });

  // 请求拦截器：记录重试次数，避免死循环
  client.interceptors.request.use((config) => {
    const attempt = (config as unknown as { __retry?: number }).__retry ?? 0;
    (config as unknown as { __retry?: number }).__retry = attempt;
    return config;
  });

  // 响应拦截器：对可重试的失败进行指数退避重试
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as (typeof error.config & { __retry?: number }) | undefined;
      if (!config) return Promise.reject(error);

      const attempt = config.__retry ?? 0;
      // 仅重试网络错误 / 5xx / 超时，不重试 4xx（参数错误）
      const retryable =
        !error.response ||
        error.response.status >= 500 ||
        error.code === "ECONNABORTED" ||
        error.code === "ECONNREFUSED";

      if (retryable && attempt < retries) {
        config.__retry = attempt + 1;
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        return client.request(config);
      }
      return Promise.reject(error);
    }
  );

  return client;
}
