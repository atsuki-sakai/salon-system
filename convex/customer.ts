import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const add = mutation({
  args: {
    salonId: v.string(),
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
      salonId: args.salonId,
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

    return await ctx.db.patch(existingCustomer._id, {
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
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonCustomers = await ctx.db
      .query("customer")
      .collect();
    return salonCustomers.filter(customer => customer.salonId === args.salonId);
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
