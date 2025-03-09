// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  admin: defineTable({
    clerkId: v.string(),
    email: v.string(),
    password: v.string(),
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"]),

  salon: defineTable({
    clerkId: v.string(), // clerkIdのuser.id
    salonId: v.optional(v.string()), // salonId固有のID
    stripeCustomerId: v.string(),  // Stripe顧客ID
    email: v.string(),             // Emailアドレス
    subscriptionId: v.optional(v.string()),    // 現在のサブスクリプションID
    subscriptionStatus: v.optional(v.string()) // サブスクリプションの状態
  })
  .index("by_clerk_id", ["clerkId"]) // インデックスを最初に定義
  .index("by_stripe_customer_id", ["stripeCustomerId"])  // 追加
  .index("by_salon_id", ["salonId"])
  .searchIndex("search_users", { searchField: "clerkId" })
  .searchIndex("search_by_stripe_customer_id", { searchField: "stripeCustomerId" })
  .searchIndex("search_by_salon_id", { searchField: "salonId" }),

  subscription: defineTable({
    subscriptionId: v.string(),   // StripeサブスクリプションID
    customerId: v.string(),       // Stripe顧客ID (userとの関連に使用)
    status: v.string(),           // ステータス ("active", "past_due", "canceled", etc.)
    priceId: v.optional(v.string()),          // 購読プランID（Price ID）
    currentPeriodEnd: v.optional(v.string())  // 現在の課金期間の終了タイムスタンプ (Unix時間)
  })
  .index("by_subscription_id", ["subscriptionId"])
  .searchIndex("search_subscriptions", { searchField: "subscriptionId" }),

  customer: defineTable({
    salonId: v.string(),
    lineId: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    tags: v.optional(v.array(v.string())),
    lastReservationDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性")))
  })
  .index("by_salon_id", ["salonId"])
  .index("by_email", ["email"])
  .searchIndex("search_by_salon_id", { searchField: "salonId" })
  .searchIndex("search_by_email", { searchField: "email" }),

  staff: defineTable({
    salonId: v.string(),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
    extraCharge: v.optional(v.number()),
    description: v.optional(v.string()),
    imgFileId: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string()))
  })
  .index("by_salon_id", ["salonId"])
  .searchIndex("search_by_salon_id", { searchField: "salonId" }),

  menu: defineTable({
    salonId: v.string(),
    name: v.string(),
    price: v.number(),
    salePrice: v.optional(v.number()),
    timeToMin: v.number(),
    category: v.optional(v.string()),
    imgFileId: v.optional(v.string()),
    availableStaffIds: v.array(v.string()),
    description: v.optional(v.string()),
    couponId: v.optional(v.string()),
    targetGender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
  })
  .index("by_salon_id", ["salonId"])
  .searchIndex("search_by_salon_id", { searchField: "salonId" }),

  reservation: defineTable({
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    staffExtraCharge: v.optional(v.number()),
    menuId: v.string(),
    menuName: v.string(),
    price: v.number(),
    salonId: v.string(),
    salonName: v.optional(v.string()),
    reservationDate: v.string(),
    status: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    notes: v.optional(v.string()),
    selectedOptions: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      salePrice: v.optional(v.number()),
      maxCount: v.optional(v.number()),
    }))),
  })
  .index("by_customer_id", ["customerId"])
  .index("by_staff_id", ["staffId"])
  .index("by_menu_id", ["menuId"])
  .searchIndex("search_by_customer_id", { searchField: "customerId" })
  .searchIndex("search_by_staff_id", { searchField: "staffId" })
  .searchIndex("search_by_menu_id", { searchField: "menuId" }),

  salon_config: defineTable({
    salonId: v.string(),
    salonName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    regularOpenTime: v.optional(v.string()),
    regularCloseTime: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    options: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      salePrice: v.optional(v.number()),
      maxCount: v.optional(v.number()),
    }))),
    reservationRules: v.optional(v.string()),
    imgFileId: v.optional(v.string()),
  })
  .index("by_salon_id", ["salonId"])
  .searchIndex("search_by_salon_id", { searchField: "salonId" }),
  
});
