// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clerk ユーザーの登録/更新を行う関数
 */
export const registerUser = mutation({
  args: { 
    clerkId: v.string(), 
    email: v.string(), 
    stripeCustomerId: v.string() 
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))
      .first();
    if (existingUser) {
      return await ctx.db.patch(existingUser._id, { email: args.email });
    }
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      stripeCustomerId: args.stripeCustomerId,
      subscriptionId: undefined,
      subscriptionStatus: undefined,
    });
  },
});

/**
 * ユーザーのサブスクリプション情報を更新する Mutation
 * まず、users テーブルの "by_subscription_id" インデックスでユーザーを検索し、
 * 見つからなければ subscriptions テーブルから対象のサブスクリプションを取得し、
 * その customerId でユーザーを検索します。
 */
export const updateSubscription = mutation({
  args: { 
    subscriptionId: v.string(), 
    subscriptionStatus: v.string(),
    customerId: v.string()
  },
  handler: async (ctx, args) => {
    // まず、users テーブルの "by_subscription_id" インデックスでユーザーを検索
    let user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.customerId))
      .first();

    if (!user) {
      // ユーザーに subscriptionId がまだセットされていない場合、subscriptions テーブルから対象サブスクリプションを取得
      const subRecord = await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
        .first();
      if (!subRecord) return null;
      // その後、stripeCustomerId でユーザーを検索する
      user = await ctx.db
        .query("users")
        .filter(q => q.eq("stripeCustomerId", subRecord.customerId))
        .first();
      if (!user) return null;
    }

    return await ctx.db.patch(user._id, {
      subscriptionId: args.subscriptionId,
      subscriptionStatus: args.subscriptionStatus,
    });
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return null;
    await ctx.db.delete(user._id);
    return true;
  },
});
