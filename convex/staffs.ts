import { mutation, query } from "./_generated/server";
import { v } from "convex/values"

export const createStaff = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    salonId: v.string(),
    menuIds: v.array(v.string()),
    description: v.string(),
    gender: v.string(),
    image: v.string(),
    holidays: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.insert("staffs", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      salonId: args.salonId,
      menuIds: args.menuIds,
      description: args.description,
      gender: args.gender,
      image: args.image,
      holidays: args.holidays,
    });
    return staff;
  },
});

export const updateStaff = mutation({
  args: {
    id: v.id("staffs"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    salonId: v.string(),
    menuIds: v.array(v.string()),
    description: v.string(),
    gender: v.string(),
    image: v.string(),
    holidays: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.patch(args.id, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      salonId: args.salonId,
      menuIds: args.menuIds,
      description: args.description,
      gender: args.gender,
      image: args.image,
      holidays: args.holidays,
    });
    return staff;
  },
});

export const deleteStaff = mutation({
  args: {
    id: v.id("staffs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStaff = query({
  args: {
    id: v.id("staffs"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.id);
    return staff;
  },
});

export const getStaffsBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const staffs = await ctx.db.query("staffs").filter(q => q.eq(q.field("salonId"), args.salonId)).collect();
    return staffs;
  },
});

export const getStaffsByStaffIds = query({
  args: {
    staffIds: v.array(v.id("staffs")),
  },
  handler: async (ctx, args) => {
    const staffs = await Promise.all(args.staffIds.map(async (staffId) => {
      const staff = await ctx.db.get(staffId);
      return staff;
    }));
    return staffs;
  },
});
