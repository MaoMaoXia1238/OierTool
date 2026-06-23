/**
 * SVG 图形验证码生成工具
 * 生成 4 位随机字符验证码，以 SVG 图片形式返回。
 * 使用 crypto 模块确保密码学安全的随机性。
 */
import crypto from "crypto";

// 内存缓存（挂载到 globalThis 确保 Turbopack 下跨路由共享）
// Turbopack 会为不同路由 handler 创建独立的模块实例，
// 普通 module-level Map 会不共享导致验证码永远校验失败
const globalCaptcha = globalThis as typeof globalThis & {
  __captchaStore?: Map<string, { answer: string; expires: number }>;
};
if (!globalCaptcha.__captchaStore) {
  globalCaptcha.__captchaStore = new Map();
}
const captchaStore = globalCaptcha.__captchaStore;

// 验证码字符集（去除了易混淆的 0O1lI）
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

// 清理过期验证码（每 60 秒执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore) {
    if (data.expires < now) captchaStore.delete(id);
  }
}, 60_000);

/**
 * 生成 4 位随机字符
 */
function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

/**
 * 渲染 SVG 图形验证码
 */
function renderSvg(text: string): string {
  const width = 120;
  const height = 44;
  const colors = ["#1a73e8", "#e37400", "#c5221f", "#188038", "#9334e6"];
  let paths = "";
  // 5 条干扰线
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ddd" stroke-width="1"/>`;
  }
  // 4 个字符，每个独立颜色 + 旋转 + 偏移
  const charEls = text
    .split("")
    .map((ch, i) => {
      const color = colors[i % colors.length];
      const rotate = Math.floor(Math.random() * 30) - 15;
      const x = 18 + i * 26;
      const y = 30 + Math.floor(Math.random() * 6) - 3;
      return `<text x="${x}" y="${y}" transform="rotate(${rotate},${x},${y})" fill="${color}" font-size="24" font-family="Arial,Helvetica,sans-serif" font-weight="bold">${ch}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8f9fa" rx="6"/>
  ${paths}
  ${charEls}
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#eee" stroke-width="0.5" stroke-dasharray="3,3"/>
</svg>`;
}

/**
 * 生成图形验证码
 * @returns captchaId（用于校验）和 svg（前端渲染）
 */
export function generateCaptcha(): { captchaId: string; svg: string } {
  const answer = randomChars(4);
  const captchaId = crypto.randomUUID();
  const expires = Date.now() + 5 * 60 * 1000; // 5 分钟有效

  captchaStore.set(captchaId, { answer, expires });

  const svg = renderSvg(answer);
  return { captchaId, svg };
}

/**
 * 校验图形验证码
 * @returns 是否通过
 */
export function verifyCaptcha(captchaId: string, answer: string): boolean {
  const data = captchaStore.get(captchaId);
  if (!data) return false;
  if (data.expires < Date.now()) {
    captchaStore.delete(captchaId);
    return false;
  }
  // 比对后立即删除（一次性使用）
  captchaStore.delete(captchaId);
  return data.answer.toUpperCase() === answer.toUpperCase();
}
