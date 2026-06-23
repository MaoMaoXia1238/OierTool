/**
 * Auth.js v5 主配置文件
 * 引入 auth.config.ts（边缘安全配置）并添加 Prisma adapter 和 Credentials Provider。
 * 支持密码登录和验证码登录两种方式。
 */
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
        code: { label: "验证码", type: "text" },
        loginType: { label: "登录方式", type: "text" },
      },
      authorize: async (credentials) => {
        const { email, password, code, loginType } = credentials as {
          email: string;
          password?: string;
          code?: string;
          loginType?: string;
        };

        if (!email) return null;

        // 从数据库查找用户
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // 验证码登录
        if (loginType === "code") {
          if (!code || code.length !== 6) return null;

          // 查询验证码记录
          const token = await prisma.verificationToken.findUnique({
            where: {
              identifier_token: {
                identifier: email,
                token: code,
              },
            },
          });

          if (!token || token.expires < new Date()) return null;

          // 验证通过，删除已使用的验证码
          await prisma.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: email,
                token: code,
              },
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // 密码登录（默认，兼容旧格式无 loginType 的情况）
        if (!user.password) return null;
        if (!user.emailVerified) return null;  // 未验证邮箱禁止登录
        if (!password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // JWT 回调：将用户角色写入 token
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    // Session 回调：将 token 中的角色传递给客户端 session
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role =
          (token as { role?: string }).role ?? "USER";
      }
      return session;
    },
  },
});
