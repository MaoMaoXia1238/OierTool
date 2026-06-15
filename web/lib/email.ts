/**
 * 邮件发送工具模块
 * 封装腾讯云 SES 邮件推送服务，用于发送验证码邮件。
 * 支持降级策略：未配置 SES 环境变量时，验证码打印到控制台。
 */
import * as tencentcloud from "tencentcloud-sdk-nodejs-ses";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const SesClient = tencentcloud.ses.v20201002.Client;

// 直接从 .env 文件读取配置（绕过 Turbopack 编译时 process.env 被剥离的问题）
function getEnvConfig() {
  // CWD 是 web/ workspace 目录，.env 在项目根即上级目录
  const envPath = path.resolve(process.cwd(), "..", ".env");

  if (!fs.existsSync(envPath)) return null;

  const content = fs.readFileSync(envPath, "utf-8");
  const parsed = dotenv.parse(content);

  return {
    secretId: parsed.TENCENT_SECRET_ID || "",
    secretKey: parsed.TENCENT_SECRET_KEY || "",
    fromEmail: parsed.SES_FROM_EMAIL || "",
    templateId: parsed.SES_TEMPLATE_ID || "",
    region: parsed.SES_REGION || "ap-guangzhou",
  };
}

// 初始化 SES 客户端（仅在配置齐全时）
function getClient() {
  const config = getEnvConfig();
  if (
    !config ||
    !config.secretId ||
    !config.secretKey ||
    !config.fromEmail ||
    !config.templateId
  ) {
    return null;
  }

  return {
    client: new SesClient({
      credential: {
        secretId: config.secretId,
        secretKey: config.secretKey,
      },
      region: config.region,
      profile: {
        httpProfile: { endpoint: "ses.tencentcloudapi.com" },
      },
    }),
    config,
  };
}

/**
 * 发送邮箱验证码
 * @param toEmail 收件人邮箱
 * @param code 6位数字验证码
 * @returns 是否发送成功
 */
export async function sendVerificationCode(
  toEmail: string,
  code: string
): Promise<boolean> {
  const result = getClient();

  // 降级策略：未配置 SES 时打印到控制台
  if (!result) {
    console.log("═══════════════════════════════════════");
    console.log(`  [邮件降级] 验证码已生成（SES 未配置）`);
    console.log(`  收件人：${toEmail}`);
    console.log(`  验证码：${code}`);
    console.log("═══════════════════════════════════════");
    return true;
  }

  const { client, config } = result;

  try {
    await client.SendEmail({
      FromEmailAddress: config.fromEmail,
      Destination: [toEmail],
      Subject: "[OierTool] 邮箱验证码",
      Template: {
        TemplateID: Number(config.templateId),
        TemplateData: JSON.stringify({ code, expire_minutes: "10" }),
      },
    });
    return true;
  } catch (error) {
    console.error("SES 邮件发送失败:", error);
    return false;
  }
}

/**
 * 生成 6 位随机数字验证码
 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
