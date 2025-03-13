import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";


export const add = mutation({
  args: {
    salonId: v.string(),
    lineId: v.optional(v.string()),
    lineUserName: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lastReservationDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
  },
  handler: async (ctx, args) => {
    const customerId = await ctx.db.insert("customer", {
      ...args,
    });
    return customerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("customer"),
    lineId: v.optional(v.string()),
    lineUserName: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lastReservationDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
  },
  handler: async (ctx, args) => {
    const existingCustomer = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("_id"), args.id))
      .first();

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    const customerId = await ctx.db.patch(existingCustomer._id, {
      lineId: args.lineId,
      lineUserName: args.lineUserName,
      email: args.email,
      phone: args.phone,
      firstName: args.firstName,
      lastName: args.lastName,
      tags: args.tags,
      lastReservationDate: args.lastReservationDate,
      notes: args.notes,
      age: args.age,
      gender: args.gender,
    });
    return customerId;
  },
});

export const trash = mutation({
  args: {
    id: v.id("customer"),
  },
  handler: async (ctx, args) => {
    const existingCustomer = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("_id"), args.id))
      .first();

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    return await ctx.db.delete(existingCustomer._id);
  },
});

export const exist = query({
  args: {
    salonId: v.string(),
    lineId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const salonCustomers = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .filter(q => q.eq(q.field("lineId"), args.lineId))
      .first();
    return salonCustomers;
  },
});


export const getCustomersBySalonId = query({
  args: {
    paginationOpts: paginationOptsValidator,
    salonId: v.string(),
    lineId: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const direction = args.sortDirection ?? "desc";
    // サロンIDでフィルタし、_creationTime で並び替え（Convex では order() はソート方向のみを指定）

    let q;
    if (args.lineId) {
      q = ctx.db
        .query("customer")
        .filter(q => q.eq(q.field("salonId"), args.salonId))
        .filter(q => q.eq(q.field("lineId"), args.lineId))
        .order(direction);
    } else {
      q = ctx.db
        .query("customer")
        .filter(q => q.eq(q.field("salonId"), args.salonId))
        .order(direction);
    }

    const result = await q.paginate(args.paginationOpts);
    return result;
  },
});



// 顧客の総数のみを取得するAPI
export const getCustomersCountBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const totalCustomers = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .collect();

    return totalCustomers.length;
  },
});




export const getCustomerById = query({
  args: {
    id: v.id("customer"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("_id"), args.id))
      .first();
    
    return customer;
  },
});

export const getCustomersByLineId = query({
  args: {
    lineId: v.string(),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("lineId"), args.lineId))
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .first();
    
    return customer;
  },
});