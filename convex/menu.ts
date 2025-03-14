import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";

export const add = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const menuId = await ctx.db.insert("menu", {
      ...args
    });
    return menuId;
  },
});

export const update = mutation({
  args: {
    id: v.id("menu"),
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
  },
  handler: async (ctx, args) => {
    const menuId = await ctx.db.patch(args.id, {
      name: args.name,
      price: args.price,
      salePrice: args.salePrice,
      timeToMin: args.timeToMin,
      category: args.category,
      imgFileId: args.imgFileId,
      availableStaffIds: args.availableStaffIds,
      description: args.description,
      couponId: args.couponId,
      targetGender: args.targetGender,
    });
    return menuId;
  },
});

export const trash = mutation({
  args: {
    id: v.id("menu"),
  },        
  handler: async (ctx, args) => {
    const existingMenu = await ctx.db
      .query("menu")
      .filter(q => q.eq(q.field("_id"), args.id))
      .first();

    if (!existingMenu) {
      throw new ConvexError({message: "このメニューは存在しません"});
    }

    return await ctx.db.delete(existingMenu._id);
  },
});

export const getMenu = query({
  args: {
    id: v.id("menu"),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.id);
    return menu;
  },
});

export const getMenusBySalonId = query({
  args: {
    salonId: v.string(),
    paginationOpts: paginationOptsValidator,
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const direction = args.sortDirection ?? "desc";
    const q = ctx.db.query("menu").filter(q => q.eq(q.field("salonId"), args.salonId)).order(direction);
    const result = await q.paginate(args.paginationOpts);
    return result;
  },
});

