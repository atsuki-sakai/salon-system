import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const createCustomer = mutation({
  args: {
    uid: v.string(),
    email: v.string(),
    phone: v.string(),
    name: v.string(),
    salonIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.insert("customers", {
      uid: args.uid,
      email: args.email,
      phone: args.phone,
      name: args.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salonIds: args.salonIds,
    });

    return customer;
  },
});

export const getCustomersBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonCustomers = await ctx.db
      .query("customers")
      .collect();

    return salonCustomers.filter(customer => customer.salonIds.includes(args.salonId));
  },
});

export const getCustomerByUid = query({
  args: {
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .filter(q => q.eq(q.field("uid"), args.uid))
      .first();

    return customer;
  },
});

export const updateCustomer = mutation({
  args: {
    uid: v.string(),
    email: v.string(),
    phone: v.string(),
    name: v.string(),
    salonIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingCustomer = await ctx.db
      .query("customers")
      .filter(q => q.eq(q.field("uid"), args.uid))
      .first();

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    return await ctx.db.patch(existingCustomer._id, {
      email: args.email,
      phone: args.phone,
      name: args.name,
      salonIds: args.salonIds,
      updatedAt: new Date().toISOString(),
    });
  },
});

