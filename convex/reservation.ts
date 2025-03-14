
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { timeStringToMinutes, minutesToTimeString, computeAvailableTimeSlots, createFullDateTime } from "../lib/scheduling";
import { ConvexError } from "convex/values";
// import type { TimeSlot } from "../lib/types";

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

export const get = query({
  args: {
    reservationId: v.id("reservation"),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    return reservation;
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
    customerFullName: v.string(),
    customerPhone: v.string(),
    staffId: v.string(),
    staffName: v.string(),
    staffExtraCharge: v.optional(v.number()),
    menuId: v.string(),
    menuName: v.string(),
    totalPrice: v.number(),
    salonId: v.string(),
    salonName: v.optional(v.string()),
    reservationDate: v.string(),
    status: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    notes: v.string(),
    selectedOptions: v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      salePrice: v.optional(v.number())
    })),
  },
  handler: async (ctx, args) => {
    // 予約日付をYYYY-MM-DD形式に変換
    const reservationDateOnly = args.reservationDate.split('T')[0]!;

    // 既存の予約を検索
    const existingReservations = await ctx.db
      .query("reservation")
      .filter((q) => 
        q.and(
          q.eq(q.field("staffId"), args.staffId),
          q.eq(q.field("reservationDate"), reservationDateOnly)
        )
      )
      .collect();

    // 時間形式の標準化: HH:MM 形式であることを確認
    const startTimeStr = args.startTime.includes('T') ? args.startTime.split('T')[1] : args.startTime;
    const endTimeStr = args.endTime.includes('T') ? args.endTime.split('T')[1] : args.endTime;

    // 時間を分単位に変換（timeStringToMinutes関数を使用）
    const newStartMinutes = timeStringToMinutes(startTimeStr!);
    const newEndMinutes = timeStringToMinutes(endTimeStr!);

    // 時間の重複をチェック（分単位で比較）
    const hasConflict = existingReservations.some(reservation => {
      // 既存の予約の時間文字列を取得
      const existingStartStr = reservation.startTime.includes('T') 
        ? reservation.startTime.split('T')[1] 
        : reservation.startTime;
      const existingEndStr = reservation.endTime.includes('T') 
        ? reservation.endTime.split('T')[1] 
        : reservation.endTime;

      // 分単位に変換
      const existingStartMinutes = timeStringToMinutes(existingStartStr!);
      const existingEndMinutes = timeStringToMinutes(existingEndStr!);

      // 時間重複のチェック（分単位で比較）
      return (
        (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
        (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
        (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
      );
    });

    if (hasConflict) {
      // 重複している予約を特定
      throw new ConvexError({message: "予約が重複しています"});
    }

    // ISO形式の完全な日時文字列を作成
    const fullStartTime = createFullDateTime(reservationDateOnly, startTimeStr!);
    const fullEndTime = createFullDateTime(reservationDateOnly, endTimeStr!);

    // 重複がなければ予約を作成
    const reservationId = await ctx.db.insert("reservation", {
      ...args,
      reservationDate: reservationDateOnly, // 日付部分のみを保存
      startTime: fullStartTime, // ISO形式の完全な開始時間
      endTime: fullEndTime,     // ISO形式の完全な終了時間
    });
    
    return reservationId;
  },
});

export const update = mutation({
  args: {
    reservationId: v.id("reservation"),
    customerId: v.optional(v.string()),
    customerFullName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    staffId: v.optional(v.string()),
    staffName: v.optional(v.string()),
    staffExtraCharge: v.optional(v.number()),
    menuId: v.optional(v.string()),
    menuName: v.optional(v.string()),
    totalPrice: v.optional(v.number()),
    salonId: v.optional(v.string()),
    salonName: v.optional(v.string()),
    reservationDate: v.optional(v.string()),
    status: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.string(),
    notes: v.optional(v.string()),
    selectedOptions: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      salePrice: v.optional(v.number()),
      quantity: v.number(),
    })))
  },
  handler: async (ctx, args) => { 
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new ConvexError({message: "予約が見つかりません"});
    }
    await ctx.db.patch(args.reservationId, {
      customerId: args.customerId,
      customerFullName: args.customerFullName,
      customerPhone: args.customerPhone,
      staffId: args.staffId,
      staffName: args.staffName,
      staffExtraCharge: args.staffExtraCharge,
      menuId: args.menuId,
      menuName: args.menuName,
      totalPrice: args.totalPrice,
      salonId: args.salonId,
      salonName: args.salonName,
      reservationDate: args.reservationDate,
      status: args.status,
      startTime: args.startTime,
      endTime: args.endTime,
      notes: args.notes,
      selectedOptions: args.selectedOptions,
    });
  },
});

export const trash = mutation({
  args: {
    reservationId: v.id("reservation"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reservationId);
  },
});


export const findOptimalTimeSlots = query({
  args: {
    menuId: v.id("menu"),
    salonId: v.string(),
    staffId: v.id("staff"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. メニュー情報の取得
    const menu = await ctx.db.get(args.menuId);
    if (!menu) {
      return { success: false, message: "指定されたメニューが見つかりません" };
    }
    
    // 2. サロン設定から営業時間と休日の取得
    const salonConfig = await ctx.db.query("salon_config")
      .filter(q => q.eq(q.field("salonId"), args.salonId))
      .first();

    // 3. 対象の日付（日付部分のみを取得）
    // 明示的に型を指定して、常に文字列を返すことを保証
    const targetDate: string | undefined = args.date
      ? args.date.split('T')[0]!  // 非nullアサーションを追加
      : new Date().toISOString().split("T")[0]; // 今日の日付
    
    // 日付から曜日を取得（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
    // ここで型エラーが発生していましたが、targetDateの型を明示したので解決
    const targetDay = new Date(targetDate!).getDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[targetDay];
    
    // 4. bussinessInfoから営業時間を取得
    const bussinessInfo = salonConfig?.bussinessInfo;
    let openTime = timeStringToMinutes("09:00"); // デフォルト値
    let closeTime = timeStringToMinutes("20:00"); // デフォルト値
   

    if (bussinessInfo) {
      // 4.1 営業日チェック
      if (bussinessInfo.businessDays && !bussinessInfo.businessDays.includes(dayName!)) {
        return { success: false, message: "選択された日は営業日ではありません" };
      }

      // 4.2 営業時間の取得
      if (bussinessInfo.useCommonHours) {
        // 共通時間を使用
        if (bussinessInfo.commonOpenTime && bussinessInfo.commonCloseTime) {
          openTime = timeStringToMinutes(bussinessInfo.commonOpenTime);
          closeTime = timeStringToMinutes(bussinessInfo.commonCloseTime);
        }
      } else {
        // 曜日ごとの設定を使用
        const daySettings = bussinessInfo.hoursSettings?.[dayName as keyof typeof bussinessInfo.hoursSettings];
        if (daySettings) {
          if (!daySettings.isOpen) {
            return { success: false, message: `${dayName}曜日は営業していません` };
          }
          if (daySettings.openTime && daySettings.closeTime) {
            openTime = timeStringToMinutes(daySettings.openTime);
            closeTime = timeStringToMinutes(daySettings.closeTime);
          }
        }
      }
    }
    
    // サロンの休日に含まれる場合はエラーを返す
    if (salonConfig?.regularHolidays && salonConfig.regularHolidays.includes(targetDate!)) {
      return { success: false, message: "選択された日はサロンの休業日です" };
    }
    
    // 5. 対応可能なスタッフの取得
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
    
    // 6. 全スタッフに対して、予約情報から利用可能な時間枠を計算
    const availableSlots = [];
    for (const staff of staffs) {
      // 指定日のスタッフの予約を取得
      const reservations = await ctx.db.query("reservation")
        .filter(q => q.eq(q.field("staffId"), staff._id))
        .filter(q => q.eq(q.field("reservationDate"), targetDate))
        .collect();
      
      // 予約情報を「startTime」と「endTime」を分単位に変換
      const bookedTimes = reservations.map(res => {
        // 予約時間からHH:MM部分を抽出
        const startTime = res.startTime.includes('T') 
          ? res.startTime.split('T')[1]! // 非nullアサーションを追加
          : res.startTime;
        const endTime = res.endTime.includes('T') 
          ? res.endTime.split('T')[1]! // 非nullアサーションを追加
          : res.endTime;
          
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
        const startTimeStr = minutesToTimeString(slot);
        const endTimeStr = minutesToTimeString(slot + menu.timeToMin);
        
        // ISO形式の完全な日時文字列を作成
        const fullStartTime = createFullDateTime(targetDate!, startTimeStr);
        const fullEndTime = createFullDateTime(targetDate!, endTimeStr);
        
        availableSlots.push({
          date: targetDate,
          staffId: staff._id,
          staffName: staff.name || "スタッフ",
          startTime: fullStartTime, // ISO形式の完全な日時
          endTime: fullEndTime      // ISO形式の完全な日時
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


