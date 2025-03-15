// lib/env.ts
import { z } from 'zod';

// 必要な環境変数の検証スキーマ
export const envSchema = z.object({
  // 公開環境変数（クライアントサイドで利用可能）
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PRICE_ID: z.string().min(1),
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_URL: z.string().url(),
  
  // 非公開環境変数（サーバーサイドのみ）
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32).optional(),
});

// プロセス環境変数の解析と検証
export const processEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  
  // サーバーサイドのみの環境変数
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
};


const envParseResult = envSchema.safeParse(processEnv);

// 検証エラーがある場合は詳細をログに出力して例外をスロー
if (!envParseResult.success) {
  console.error(
    '無効な環境変数:',
    envParseResult.error.flatten().fieldErrors
  );
  throw new Error('無効な環境変数が設定されています。');
}