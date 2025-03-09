import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";


export const add = mutation({
  args: {
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
    email: v.string(),
    phone: v.string(),
    firstName: v.string(),
    lastName: v.string(),
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
      ...args,
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
  },
  handler: async (ctx, args) => {
    const salonCustomers = await ctx.db
      .query("customer")
      .collect();
    return salonCustomers.filter(customer => customer.salonId === args.salonId);
  },
});


export const getCustomersBySalonId = query({
  args: {
    paginationOpts: paginationOptsValidator,
    salonId: v.string(),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const direction = args.sortDirection ?? "desc";
    // サロンIDでフィルタし、_creationTime で並び替え（Convex では order() はソート方向のみを指定）
    const q = ctx.db
      .query("customer")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .order(direction);

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