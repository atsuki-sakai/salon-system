import { z } from "zod";

export const signInSignUpSchema = z.object({
  email: z.string().email({ message: "メールアドレスが無効です" }),
  password: z.string().min(8, { message: "パスワードは8文字以上で入力してください" }),
});

export const clerkWebhookSchema = z.object({
    type: z.string().min(1, { message: "イベントタイプが空です" }),
    data: z.object({
      id: z.string().min(1, { message: "ユーザーIDが空です" }),
      email_addresses: z.array(z.object({ email_address: z.string().email({ message: "メールアドレスが無効です" }) })),
    }),
  });


export const stripeWebhookSchema = z.object({
  id: z.string().min(1, { message: "IDが空です" }),
  object: z.string().min(1, { message: "オブジェクトが空です" }),
  type: z.string().min(1, { message: "イベントタイプが空です" }),
  data: z.object({
    object: z.any(),
  }),
});
