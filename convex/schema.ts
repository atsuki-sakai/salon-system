
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),    
    salonName: v.optional(v.string()),  // salonNameを任意フィールドに変更
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
  .searchIndex("search_subscriptions", { searchField: "subscriptionId" }),   // customerIdで検索するためのインデックス

  customers: defineTable({
    uid: v.string(),
    email: v.string(),
    phone: v.string(),
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    salonIds: v.array(v.string()),
  })
  .index("by_uid", ["uid"])
  .index("by_salon_id", ["salonIds"])
  .searchIndex("search_by_uid", { searchField: "uid" })
  .searchIndex("search_by_salon_id", { searchField: "salonIds" }),

  staffs: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    salonId: v.string(),
    menuIds: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    gender: v.optional(v.string()),
    image: v.optional(v.string()),
    holidays: v.optional(v.array(v.string())),
  })
  .index("by_salon_id", ["salonId"])
  .index("by_menu_id", ["menuIds"])
  .searchIndex("search_by_salon_id", { searchField: "salonId" })
  .searchIndex("search_by_menu_id", { searchField: "menuIds" }),

  menus: defineTable({
    name: v.string(),
    price: v.number(),
    salePrice: v.optional(v.number()),
    timeToMin: v.number(),
    image: v.string(),
    staffIds: v.array(v.string()),
    salonId: v.string(),
    description: v.optional(v.string()),
    couponId: v.optional(v.string()),
    targetGender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
  })
  .index("by_staff_id", ["staffIds"])
  .index("by_salon_id", ["salonId"])
  .searchIndex("search_by_staff_id", { searchField: "staffIds" })
  .searchIndex("search_by_salon_id", { searchField: "salonId" }),

  reservations: defineTable({
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    menuId: v.string(),
    menuName: v.string(),
    price: v.number(),
    salonId: v.string(),
    salonName: v.string(),
    reservationDate: v.string(),
    status: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    note: v.string(),
  })
  .index("by_customer_id", ["customerId"])
  .index("by_staff_id", ["staffId"])
  .index("by_menu_id", ["menuId"]),
});
