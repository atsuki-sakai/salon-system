import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createSetting = mutation({
  args: {
    salonId: v.string(),
    salonName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    holidays: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db.insert("settings", {
      salonId: args.salonId,
      salonName: args.salonName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      openTime: args.openTime,
      closeTime: args.closeTime,
      holidays: args.holidays,
      description: args.description,
    });
    return setting;
  },
});

export const getSetting = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db.query("settings").filter(q => q.eq(q.field("salonId"), args.salonId)).first();
    return setting;
  },
});

export const updateSetting = mutation({
  args: {
    salonId: v.string(),
    salonName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    holidays: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .first();
    
    if (!setting) {
      throw new Error("Setting not found");
    }

    const updatedSettingData = await ctx.db.patch(setting._id, {
      salonName: args.salonName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      openTime: args.openTime,
      closeTime: args.closeTime,
      holidays: args.holidays,
      description: args.description,
    });
    return updatedSettingData;
  },
});

export const existSetting = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db.query("settings").filter(q => q.eq(q.field("salonId"), args.salonId)).first();
    return setting !== null;
  },
});