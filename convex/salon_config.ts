import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
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
    lineAccessToken: v.optional(v.string()),
    lineSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const salonConfig = await ctx.db.insert("salon_config", {
      ...args
    });
    return salonConfig;
  },
});

export const getSalonConfig = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonConfig = await ctx.db.query("salon_config").filter(q => q.eq(q.field("salonId"), args.salonId)).first();
    return salonConfig;
  },
});

export const update = mutation({
  args: {
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
    lineAccessToken: v.optional(v.string()),
    lineSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const salonConfig = await ctx.db
      .query("salon_config")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .first();
    
    if (!salonConfig) {
      throw new Error("SalonConfig not found");
    }

    const updatedSalonConfigData = await ctx.db.patch(salonConfig._id, {...args});
    return updatedSalonConfigData;
  },
});

export const getSalonName = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonConfig = await ctx.db.query("salon_config").filter(q => q.eq(q.field("salonId"), args.salonId)).first();
    return salonConfig?.salonName;
  },
});

export const exist = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonConfig = await ctx.db.query("salon_config").filter(q => q.eq(q.field("salonId"), args.salonId)).first();
    return salonConfig !== null;
  },
});