import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { timeStringToMinutes, minutesToTimeString, computeAvailableTimeSlots } from "../lib/scheduling";

import type { TimeSlot } from "../lib/types";

export const getReservationsByDate = query({
  args: {
    salonId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("reservation")
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
      .query("reservation")
      .filter((q) => q.eq(q.field("salonId"), args.salonId))
      .collect();
    return reservations;
  },
});

export const getAllReservationsForCompact = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("reservation")
      .filter((q) => q.eq(q.field("salonId"), args.salonId))
      .collect();
    return reservations.map((reservation) => ({
      id: reservation._id,
      menuName: reservation.menuName,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    }));
  },
});

export const add = mutation({
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
      reservationDate: v.string(),
      status: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      note: v.string(),
    },
    handler: async (ctx, args) => {
      // 既存の予約を検索
      const existingReservations = await ctx.db
        .query("reservation")
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
      const reservationId = await ctx.db.insert("reservation", args);
      return reservationId;
    },
  });


  export const findOptimalTimeSlots = query({
    args: {
      menuId: v.id("menu"),
      salonId: v.string(),
      staffId: v.id("staff"),
      // 日付の指定がなければ、今日を基準にするなどのロジックも追加可能
    },
    handler: async (ctx, args) => {
      // 1. メニュー情報の取得
      const menu = await ctx.db.get(args.menuId);
      if (!menu) {
        return { success: false, message: "指定されたメニューが見つかりません" };
      }
      
      // 2. サロン設定から営業時間の取得（設定がなければデフォルト: 09:00〜20:00）
      const salonConfig = await ctx.db.query("salon_config")
        .filter(q => q.eq(q.field("salonId"), args.salonId))
        .first();
      const openTime = salonConfig?.regularOpenTime 
        ? timeStringToMinutes(salonConfig.regularOpenTime) 
        : timeStringToMinutes("09:00");
      const closeTime = salonConfig?.regularCloseTime 
        ? timeStringToMinutes(salonConfig.regularCloseTime) 
        : timeStringToMinutes("20:00");
      
      // 3. 対応可能なスタッフの取得
      let staffs = [];
      if (args.staffId) {
        const staff = await ctx.db.get(args.staffId);
        if (!staff || !menu.availableStaffIds.includes(staff._id)) {
          return { success: false, message: "指定されたスタッフはこのメニューを施術できません" };
        }
        staffs = [staff];
      } else {
        staffs = await ctx.db.query("staff")
          .filter(q => q.eq(q.field("salonId"), args.salonId))
          .collect();
        staffs = staffs.filter(staff => menu.availableStaffIds.includes(staff._id));
        if (staffs.length === 0) {
          return { success: false, message: "このメニューを施術できるスタッフが存在しません" };
        }
      }
      
      // 4. 対象の日付（ここでは例として今日の日付を使用）
      const todayStr = new Date().toISOString().split("T")[0];
  
      // 5. 全スタッフに対して、予約情報から利用可能な時間枠を計算
      const availableSlots: TimeSlot[] = [];
      for (const staff of staffs) {
        // スタッフの当日の予約を取得
        const reservations = await ctx.db.query("reservation")
          .filter(q => q.eq(q.field("staffId"), staff._id))
          .filter(q => q.eq(q.field("reservationDate"), todayStr))
          .collect();
        
        // 予約情報を「startTime」と「endTime」を分単位に変換
        const bookedTimes = reservations.map(res => {
          // 予約時間は "YYYY-MM-DDTHH:mm" の形式と想定
          const startTime = res.startTime.split("T")[1] || "00:00";
          const endTime = res.endTime.split("T")[1] || "00:00";
          return {
            start: timeStringToMinutes(startTime),
            end: timeStringToMinutes(endTime)
          };
        }).sort((a, b) => a.start - b.start);
        
        // 予約空き時間を計算
        const slots = computeAvailableTimeSlots(
          openTime,
          closeTime,
          bookedTimes,
          menu.timeToMin, // 例：パーマなら120分、カットなら20分
          10 // 10分間隔で提案
        );
        
        // 空き時間枠を結果に追加（時間文字列に変換）
        for (const slot of slots) {
          availableSlots.push({
            date: todayStr,
            staffId: staff._id,
            staffName: staff.name || "スタッフ",
            startTime: minutesToTimeString(slot),
            endTime: minutesToTimeString(slot + menu.timeToMin)
          });
        }
      }
      
      // 時系列にソートして最初の5枠をおすすめとして返す
      availableSlots.sort((a, b) => {
        if (!a.date || !b.date || a.date !== b.date) {
          return (a.date || "").localeCompare(b.date || "");
        }
        return a.startTime.localeCompare(b.startTime);
      });
      
      return {
        success: true,
        menu,
        availableSlots,
        recommendedSlots: availableSlots.slice(0, 5)
      };
    }
  });