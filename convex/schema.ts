// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),           // ClerkユーザーID
    stripeCustomerId: v.string(),  // Stripe顧客ID
    email: v.string(),             // Emailアドレス
    subscriptionId: v.optional(v.string()),    // 現在のサブスクリプションID
    subscriptionStatus: v.optional(v.string()) // サブスクリプションの状態
  })
  .index("by_clerk_id", ["clerkId"]) // インデックスを最初に定義
  .index("by_stripe_customer_id", ["stripeCustomerId"])  // 追加
  .searchIndex("search_users", { searchField: "clerkId" })
  .searchIndex("search_by_stripe_customer_id", { searchField: "stripeCustomerId" }),

  subscriptions: defineTable({
    subscriptionId: v.string(),   // StripeサブスクリプションID
    customerId: v.string(),       // Stripe顧客ID (userとの関連に使用)
    status: v.string(),           // ステータス ("active", "past_due", "canceled", etc.)
    priceId: v.optional(v.string()),          // 購読プランID（Price ID）
    currentPeriodEnd: v.optional(v.string())  // 現在の課金期間の終了タイムスタンプ (Unix時間)
  })
  .index("by_subscription_id", ["subscriptionId"])
  .searchIndex("search_subscriptions", { searchField: "subscriptionId" })   // customerIdで検索するためのインデックス
});
