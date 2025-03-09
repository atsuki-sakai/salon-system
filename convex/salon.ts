// convex/users.ts

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clerk ユーザーの登録/更新を行う関数
 */
export const add = mutation({
  args: { 
    clerkId: v.string(), 
    salonId: v.string(),
    email: v.string(), 
    stripeCustomerId: v.string() 
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("salon")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))
      .first();
    if (existingUser) {
      return await ctx.db.patch(existingUser._id, { email: args.email });
    }
    return await ctx.db.insert("salon", {
      clerkId: args.clerkId,
      salonId: args.salonId,
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
    // まず、users テーブルの "by_stripe_customer_id" インデックスでユーザーを検索
    let user = await ctx.db
      .query("salon")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.customerId))
      .first();

    if (!user) {
      // ユーザーに subscriptionId がまだセットされていない場合、subscriptions テーブルから対象サブスクリプションを取得
      const subRecord = await ctx.db
        .query("subscription")
        .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscriptionId))
        .first();
      if (!subRecord) return null;
      // その後、stripeCustomerId でユーザーを検索する
      user = await ctx.db
        .query("salon")
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

export const getSalonByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salon")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const trash = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("salon")
      .filter(q => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return null;
    await ctx.db.delete(user._id);
    return true;
  },
});

export const getStaffsBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const { salonId } = args;
    const staffs = await ctx.db.query("staff").filter(q => q.eq(q.field("salonId"), salonId)).collect();
    return staffs;
  },
});

export const getPaginatedSalons = query({
  args: {
    limit: v.number(),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit, cursor } = args;
    
    // Build the query
    let queryBuilder = ctx.db.query("salon");
    
    // Apply filter if cursor exists
    if (cursor) {
      queryBuilder = queryBuilder.filter(q => 
        q.lt(q.field("_creationTime"), cursor)
      );
    }
    
    // Apply ordering and limit, then execute
    const salons = await queryBuilder
      .order("desc")
      .take(limit + 1);
    
    // Check if there's a next page
    const hasNextPage = salons.length > limit;
    if (hasNextPage) {
      salons.pop();
    }
    
    // Calculate the next cursor
    const nextCursor = hasNextPage && salons.length > 0 
      ? salons[salons.length - 1]?._creationTime
      : null;
    return {
      salons,
      nextCursor,
      hasNextPage,
    };
  },
});