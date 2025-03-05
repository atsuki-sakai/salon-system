import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createReservation = mutation({
  args: {
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    menuId: v.string(),
    menuName: v.string(),
    salonId: v.string(),
    reservationDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    note: v.string(),
    status: v.string(),
    price: v.number(),
    salonName: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.insert("reservations", {
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      staffId: args.staffId,
      staffName: args.staffName,
      menuId: args.menuId,
      menuName: args.menuName,
      salonId: args.salonId,
      reservationDate: args.reservationDate,
      startTime: args.startTime,
      endTime: args.endTime,
      note: args.note,
      status: args.status,
      price: args.price,
      salonName: args.salonName,
    });
    return reservation;
  },
});

export const updateReservation = mutation({
  args: {
    id: v.id("reservations"),
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    menuId: v.string(),
    menuName: v.string(),
    salonId: v.string(),
    reservationDate: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    note: v.string(),
    status: v.string(),
    price: v.number(),
    salonName: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.patch(args.id, {
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      staffId: args.staffId,
      staffName: args.staffName,
      menuId: args.menuId,
      menuName: args.menuName,
      salonId: args.salonId,
      reservationDate: args.reservationDate,
      startTime: args.startTime,
      endTime: args.endTime,
      note: args.note,
      status: args.status,
      price: args.price,
      salonName: args.salonName,
    });
    return reservation;
  },
});

export const deleteReservation = mutation({
  args: {
    id: v.id("reservations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});