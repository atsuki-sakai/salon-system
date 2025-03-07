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

// Clerk Webhook
export const clerkWebhookSchema = z.object({
  type: z.string().min(1, { message: "イベントタイプが空です" }),
  data: z.object({
    id: z.string().min(1, { message: "ユーザーIDが空です" }),
    email_addresses: z.array(z.object({ email_address: z.string().email({ message: "メールアドレスが無効です" }) })),
  }),
});

// Stripe Webhook
export const stripeWebhookSchema = z.object({
  id: z.string().min(1, { message: "IDが空です" }),
  object: z.string().min(1, { message: "オブジェクトが空です" }),
  type: z.string().min(1, { message: "イベントタイプが空です" }),
  data: z.object({
    object: z.any(),
  }),
});

// サブスクリプション関連の型定義
export const subscriptionSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }),
  customerId: z.string({ message: "顧客IDが空です" }),
  priceId: z.string({ message: "価格IDが空です" }),
  subscriptionId: z.string({ message: "サブスクリプションIDが空です" }),
  status: z.string({ message: "ステータスが空です" }),
  currentPeriodEnd: z.string().optional(),
});

export const salonSchema = z.object({
  clerkId: z.string({ message: "Clerk IDが空です" }),
  salonId: z.string({ message: "サロンIDが空です" }),
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  stripeCustomerId: z.string({ message: "Stripe顧客IDが空です" }),
  subscriptionId: z.string().optional(),
  subscriptionStatus: z.string().optional(),
});

export const customerAddSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }),
  firstName: z.string().min(1, { message: "名前を入力してください" }),
  lastName: z.string().min(1, { message: "苗字を入力してください" }),
  phone: z
    .string()
    .regex(/^(\d{2,4}[-]?\d{2,4}[-]?\d{4})$/, { message: "電話番号の形式が正しくありません" }),
  email: z.string().optional().refine((email) => email === "" || z.string().email().safeParse(email).success, {
    message: "有効なメールアドレスを入力してください",
  }),
});

export const customerSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }),
  email: z.string().optional().refine((email) => email === "" || z.string().email().safeParse(email).success, {
    message: "有効なメールアドレスを入力してください",
  }),
  phone: z
  .string()
  .regex(/^(\d{2,4}[-]?\d{2,4}[-]?\d{4})$/, { message: "電話番号の形式が正しくありません" }),
  firstName: z.string().min(1, { message: "名前を入力してください" }),
  lastName: z.string().min(1, { message: "苗字を入力してください" }),
  tags: z.array(z.string()).optional(),
  lastReservationDate: z.string().optional(),
  notes: z.string().optional(),
  age: z.number().optional(),
  gender: z.enum(["全て", "男性", "女性"]).optional(),
});

export const staffSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }).optional(),
  name: z.string().min(1, { message: "お名前を入力してください" }),
  age: z.number().optional(),
  gender: z.enum(["全て", "男性", "女性"]).optional(),
  extraCharge: z.number().optional(),
  description: z.string().optional(),
  imgFileId: z.string().optional(),
  regularHolidays: z.array(z.string()).optional(),
});

export const menuSchema = z.object({
  name: z.string().min(1, { message: "メニュー名を入力してください" }),
  price: z.number().min(1, { message: "料金を入力してください" }),
  salePrice: z.number().optional(),
  timeToMin: z.string().min(1, { message: "所要時間を入力してください" }),
  imgFileId: z.string().optional(),
  availableStaffIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  couponId: z.string().optional(),
  targetGender: z.enum(["全て", "男性", "女性"]).default("全て"),
});

export const salonConfigSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }),
  salonName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  regularOpenTime: z.string().optional(),
  regularCloseTime: z.string().optional(),
  regularHolidays: z.array(z.string()).optional(),
  description: z.string().optional(),
  options: z.array(z.object({
    name: z.string(),
    price: z.number(),
    salePrice: z.number().optional(),
    maxCount: z.number().optional(),
  })).optional(),
  reservationRules: z.string().optional(),
  imgFileId: z.string().optional(),
});

export const reservationSchema = z.object({
  customerName: z.string().min(1, "お客様名を入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください"),
  staffId: z.string().min(1, "スタッフを選択してください"),
  menuId: z.string().min(1, "メニューを選択してください"),
  reservationDate: z.string().min(1, "予約日を選択してください"),
  startTime: z.string().min(1, "開始時間を選択してください"),
  notes: z.string().optional(),
});