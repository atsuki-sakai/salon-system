
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createMenu = mutation({
  args: {
    id: v.id("menus"),
    name: v.string(),
    price: v.number(),
    timeToMin: v.number(),
    image: v.string(),
    staffIds: v.array(v.string()),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.insert("menus", {
      id: args.id,
      name: args.name,
      price: args.price,
      timeToMin: args.timeToMin,
      image: args.image,
      staffIds: args.staffIds,
      salonId: args.salonId,
    });
    return menu;
  },
});

export const updateMenu = mutation({
  args: {
    id: v.id("menus"),
    name: v.string(),
    price: v.number(),
    timeToMin: v.number(),
    image: v.string(),
    staffIds: v.array(v.string()),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.patch(args.id, {
      name: args.name,
      price: args.price,
      timeToMin: args.timeToMin,
      image: args.image,
      staffIds: args.staffIds,
      salonId: args.salonId,
    });
    return menu;
  },
}); 

export const deleteMenu = mutation({
  args: {
    id: v.id("menus"),
  },        
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
}); 

export const getMenu = query({
  args: {
    id: v.id("menus"),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.id);
    return menu;
  },
});

export const getMenusBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const menus = await ctx.db.query("menus").filter(q => q.eq(q.field("salonId"), args.salonId)).collect();
    return menus;
  },
});

