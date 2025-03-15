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
  fullName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lastReservationDate: z.string().optional(),
  notes: z.string().optional(),
  age: z.number().optional(),
  gender: z.enum(["全て", "男性", "女性"]).optional(),
});

export const staffSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }).optional(),
  name: z.string().min(1, { message: "お名前を入力してください" }),
  age: z.preprocess(val => 
    val === undefined || val === "" || Number.isNaN(val) ? undefined : Number(val), 
    z.number().optional()
  ),
  gender: z.enum(["全て", "男性", "女性"]).optional(),
  extraCharge: z.preprocess(val => 
    val === undefined || val === "" || Number.isNaN(val) ? undefined : Number(val),
    z.number().optional()
  ),
  description: z.string().optional(),
  imgFileId: z.string().optional(),
  regularHolidays: z.array(z.string()).optional(),
  email: z.string({ message: "メールアドレスを入力してください" })
          .email({ message: "有効なメールアドレスを入力してください" }),
  pin: z.string({ message: "PINコードを入力してください" })
        .length(4, { message: "PINコードは4桁で入力してください" })
        .regex(/^\d+$/, { message: "PINコードは数字のみで入力してください" })
        ,
  role: z.enum(["admin", "manager", "staff"], { message: "権限を選択してください" }),
  isActive: z.boolean().optional(),
});

export const staffEditSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }).optional(),
  name: z.string().min(1, { message: "お名前を入力してください" }),
  age: z.preprocess(val => 
    val === undefined || val === "" || Number.isNaN(val) ? undefined : Number(val), 
    z.number().optional()
  ),
  gender: z.enum(["全て", "男性", "女性"]).optional(),
  extraCharge: z.preprocess(val => 
    val === undefined || val === "" || Number.isNaN(val) ? undefined : Number(val),
    z.number().optional()
  ),
  description: z.string().optional(),
  imgFileId: z.string().optional(),
  regularHolidays: z.array(z.string()).optional(),
  email: z.string({ message: "メールアドレスを入力してください" })
          .email({ message: "有効なメールアドレスを入力してください" }),
  pin: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"], { message: "権限を選択してください" }),
  isActive: z.boolean().optional(),
});


export const menuSchema = z.object({
  name: z.string().min(1, { message: "メニュー名を入力してください" }),
  price: z.number().min(1, { message: "料金を入力してください" }),
  salePrice: z.preprocess((val) => val || 0, z.number()).optional(),
  timeToMin: z.string().min(1, { message: "所要時間を入力してください" }),
  imgFileId: z.string().optional(),
  category: z.string().optional(),
  availableStaffIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  couponId: z.string().optional(),
  targetGender: z.enum(["全て", "男性", "女性"]).optional(),
});

// HH:mm形式（00:00～23:59）をチェックする正規表現
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const salonConfigSchema = z.object({
  salonId: z.string({ message: "サロンIDが空です" }),
  salonName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  regularOpenTime: z.string().regex(timeRegex, { message: "開始時間の形式が正しくありません" }).optional(),
  regularCloseTime: z.string().regex(timeRegex, { message: "開始時間の形式が正しくありません" }).optional(),
  regularHolidays: z.array(z.string()).optional(),
  description: z.string().optional(),
  options: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    salePrice: z.number().optional(),
    maxCount: z.number().optional(),
  })).optional(),
  reservationRules: z.string().optional(),
  imgFileId: z.string().optional(),
  lineAccessToken: z.string().optional(),
  lineChannelSecret: z.string().optional(),
  liffId: z.string().optional(),
  bussinessInfo: z.object({
    businessDays: z.array(z.string()),
    hoursSettings: z.object({
      monday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      tuesday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      wednesday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      thursday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      friday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      saturday: z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      }),
      sunday: z.optional(z.object({
        isOpen: z.boolean(),
        openTime: z.string(),
        closeTime: z.string()
      })),
    }),
    useCommonHours: z.boolean(),
    commonOpenTime: z.string(),
    commonCloseTime: z.string(),
  }).optional(),
});

export const reservationSchema = z.object({
  customerFullName: z.string().min(1, "お客様名を入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください"),
  staffId: z.string().min(1, "スタッフを選択してください"),
  staffName: z.string().min(1, "スタッフ名を入力してください"),
  staffExtraCharge: z.number().optional(),
  menuId: z.string().min(1, "メニューを選択してください"),
  menuName: z.string().min(1, "メニュー名を入力してください"),
  totalPrice: z.number().min(1, "料金を入力してください"),
  reservationDate: z.string().min(1, "予約日を選択してください"),
  status: z.string().min(1, "ステータスを選択してください"),
  startTime: z.string().min(1, "開始時間を選択してください"),
  endTime: z.string().min(1, "終了時間を選択してください"),
  notes: z.string().optional(),
  selectedOptions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    salePrice: z.number().optional(),
    quantity: z.number().optional(),
  })).optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  newPassword: z.string().min(1, { message: "新しいパスワードを入力してください" }).optional(),
  confirmPassword: z.string().min(1, { message: "確認用パスワードを入力してください" }).optional(),
  code: z.string().optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "パスワードと確認用パスワードが一致しません",
  path: ["confirmPassword"],
});


export const customerEditSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine((email) => email === "" || z.string().email().safeParse(email).success, {
    message: "有効なメールアドレスを入力してください",
  }),
});