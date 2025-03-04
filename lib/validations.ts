// lib/validations.ts
import { z } from "zod";

// 詳細なパスワードのバリデーション
const passwordSchema = z
  .string()
  .min(8, { message: "パスワードは8文字以上で入力してください" })
  .max(100, { message: "パスワードは100文字以下で入力してください" })
  .regex(/[a-z]/, { message: "パスワードには小文字を含める必要があります" })
  .regex(/[A-Z]/, { message: "パスワードには大文字を含める必要があります" })
  .regex(/[0-9]/, { message: "パスワードには数字を含める必要があります" })


// 認証関連のスキーマ
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: z
    .string()
    .min(1, { message: "パスワードを入力してください" }),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "有効なメールアドレスを入力してください" }),
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: "確認用パスワードを入力してください" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードと確認用パスワードが一致しません",
  path: ["confirmPassword"],
});

// 予約関連のスキーマ
export const appointmentSchema = z.object({
  staffId: z.string().min(1, { message: "スタッフを選択してください" }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "有効な日付形式ではありません" }),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "開始時間の形式が正しくありません" }),
  services: z
    .array(z.string())
    .min(1, { message: "少なくとも1つのサービスを選択してください" }),
  customerName: z
    .string()
    .min(1, { message: "お名前を入力してください" })
    .max(50, { message: "お名前は50文字以内で入力してください" }),
  customerPhone: z
    .string()
    .regex(/^\d{2,4}-\d{2,4}-\d{4}$/, { message: "電話番号の形式が正しくありません" }),
  customerNote: z
    .string()
    .max(500, { message: "備考は500文字以内で入力してください" })
    .optional(),
});