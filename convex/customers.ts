
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const createCustomer = mutation({
  args: {
    lineId: v.string(),
    email: v.string(),
    phone: v.string(),
    name: v.string(),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.insert("customers", {
      lineId: args.lineId,
      email: args.email,
      phone: args.phone,
      name: args.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salonId: args.salonId,
    });

    return customer;
  },
});

export const getCustomerByLineId = query({
  args: {
    lineId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.query("customers").filter(q => q.eq(q.field("lineId"), args.lineId)).first();
    return customer;
  },
});

