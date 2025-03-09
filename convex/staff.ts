import { mutation, query } from "./_generated/server";
import { v } from "convex/values"

export const add = mutation({
  args: {
    name: v.string(),
    salonId: v.string(),
    description: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
    imgFileId: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string())),
    extraCharge: v.optional(v.number()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const staffId = await ctx.db.insert("staff", {
      ...args,
    });
    return staffId;
  },
});

export const update = mutation({
  args: {
    id: v.id("staff"),
    name: v.string(),
    salonId: v.string(),
    description: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
    imgFileId: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string())),
    extraCharge: v.optional(v.number()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const staffId = await ctx.db.patch(args.id, {
      name: args.name,
      salonId: args.salonId,
      description: args.description,
      gender: args.gender,
      imgFileId: args.imgFileId,
      regularHolidays: args.regularHolidays,
      extraCharge: args.extraCharge,
      age: args.age,
    });
    return staffId;
  },
});

export const trash = mutation({
  args: {
    id: v.id("staff"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStaff = query({
  args: {
    id: v.id("staff"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.id);
    return staff;
  },
});

export const getAllStaffBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const staffs = await ctx.db.query("staff").filter(q => q.eq(q.field("salonId"), args.salonId)).collect();
    return staffs;
  },
});

export const getStaffByIds = query({
  args: {
    staffIds: v.array(v.id("staff")),
  },
  handler: async (ctx, args) => {
    const staffs = await Promise.all(args.staffIds.map(async (staffId) => {
      const staff = await ctx.db.get(staffId);
      return staff;
    }));
    return staffs;
  },
});
