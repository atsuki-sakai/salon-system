import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: { clerkId: v.string(), email: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      subscriptionId: undefined,
      subscriptionStatus: undefined
    });
  },
});

export const updateUser = mutation({
  args: { clerkId: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return null;
    return await ctx.db.patch(user._id, { email: args.email });
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // インデックスを使用した検索
    const userWithIndex = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return userWithIndex;
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
  },
}); 