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
      // 既存の予約を検索
      const existingReservations = await ctx.db
        .query("reservations")
        .filter((q) => 
          q.and(
            q.eq(q.field("staffId"), args.staffId),
            q.eq(q.field("reservationDate"), args.reservationDate.split('T')[0])
          )
        )
        .collect();
  
      // 時間の重複をチェック
      const hasConflict = existingReservations.some(reservation => {
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
        const conflictingReservation = existingReservations.find(reservation => {
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
  
        throw new Error(JSON.stringify({
          type: "RESERVATION_CONFLICT",
          conflictingReservation: {
            customerName: conflictingReservation?.customerName,
            startTime: conflictingReservation?.startTime,
            endTime: conflictingReservation?.endTime,
            staffName: conflictingReservation?.staffName,
            menuName: conflictingReservation?.menuName,
          }
        }));
      }
  
      // 重複がなければ予約を作成
      const reservationId = await ctx.db.insert("reservations", args);
      return reservationId;
    },
  });