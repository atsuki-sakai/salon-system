import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getReservationsByDate = query({
  args: {
    salonId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("reservations")
      .filter((q) => q.eq(q.field("salonId"), args.salonId))
      .filter((q) => q.eq(q.field("reservationDate"), args.date))
      .collect();

    return reservations;
  },
});
export const getAllReservations = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("reservations")
      .filter((q) => q.eq(q.field("salonId"), args.salonId))
      .collect();
    return reservations;
  },
});

export const create = mutation({
  args: {
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    menuId: v.string(),
    menuName: v.string(),
    price: v.number(),
    salonId: v.string(),
    salonName: v.string(),
    reservationDate: v.string(),
    status: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    // 予約時間の重複チェック
    const existingReservations = await ctx.db
      .query("reservations")
      .filter((q) => q.eq(q.field("staffId"), args.staffId))
      .filter((q) => q.eq(q.field("reservationDate"), args.reservationDate))
      .collect();

    const hasConflict = existingReservations.some((reservation) => {
      const newStart = new Date(args.startTime).getTime();
      const newEnd = new Date(args.endTime).getTime();
      const existingStart = new Date(reservation.startTime).getTime();
      const existingEnd = new Date(reservation.endTime).getTime();

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      throw new Error("Selected time slot is already booked");
    }

    const reservationId = await ctx.db.insert("reservations", args);
    return reservationId;
  },
}); 