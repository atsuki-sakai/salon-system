import { mutation, query } from "./_generated/server";
import { v } from "convex/values"
import { ConvexError } from "convex/values";

export const add = mutation({
  args: {
    name: v.string(),
    salonId: v.string(),
    description: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
    imgFileId: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string())),
    extraCharge: v.optional(v.number()),
    age: v.optional(v.number()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // メールアドレスが指定されている場合は重複チェック
    if (args.email) {
      // 同じサロン内で同じメールアドレスを持つスタッフが存在するか確認
      const duplicateStaff = await ctx.db
        .query("staff")
        .filter(q => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("salonId"), args.salonId)
          )
        )
        .first();
      
      if (duplicateStaff) {
        throw new ConvexError("このメールアドレスは既に使用されています");
      }
    }

    // 新しいスタッフを作成
    return await ctx.db.insert("staff", {
      ...args,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("staff"),
    name: v.string(),
    salonId: v.string(),
    description: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("全て"), v.literal("男性"), v.literal("女性"))),
    imgFileId: v.optional(v.string()),
    regularHolidays: v.optional(v.array(v.string())),
    extraCharge: v.optional(v.number()),
    age: v.optional(v.number()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 更新対象のスタッフが存在するか確認
    const existingStaff = await ctx.db.get(args.id);
    if (!existingStaff) {
      throw new ConvexError({message: "更新対象のスタッフが見つかりません"});
    }

    // メールアドレスが指定されていて、かつ変更されている場合のみ重複チェック
    if (args.email && args.email !== existingStaff.email) {
      // サロン内の他のスタッフで同じメールアドレスを使用していないか確認
      const duplicateStaff = await ctx.db
        .query("staff")
        .filter(q => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("salonId"), args.salonId),
            q.neq(q.field("_id"), args.id)
          )
        )
        .first();
      
      if (duplicateStaff) {
        throw new ConvexError({message: "このメールアドレスは既に他のスタッフによって使用されています"});
      }
    }

    // スタッフ情報を更新
    return await ctx.db.patch(args.id, {
      name: args.name,
      salonId: args.salonId,
      description: args.description,
      gender: args.gender,
      imgFileId: args.imgFileId,
      regularHolidays: args.regularHolidays,
      extraCharge: args.extraCharge,
      age: args.age,
      email: args.email,
      role: args.role,
      isActive: args.isActive,
    });
  },
});

export const trash = mutation({
  args: {
    id: v.id("staff"),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const salonMenus = await ctx.db.query("menu").filter(q => q.eq(q.field("salonId"), args.salonId)).collect();
    salonMenus.forEach(async (menu) => {
      if(menu.availableStaffIds.includes(args.id)) {
        await ctx.db.patch(menu._id, {
          availableStaffIds: menu.availableStaffIds.filter(id => id !== args.id),
        });
      }
    });
    await ctx.db.delete(args.id);
  },
});

export const getStaff = query({
  args: {
    id: v.id("staff"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.id);
    return staff;
  },
});

export const getAllStaffBySalonId = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const staffs = await ctx.db.query("staff").filter(q => q.eq(q.field("salonId"), args.salonId)).collect();
    return staffs;
  },
});

export const getStaffByIds = query({
  args: {
    staffIds: v.array(v.id("staff")),
  },
  handler: async (ctx, args) => {
    const staffs = await Promise.all(args.staffIds.map(async (staffId) => {
      const staff = await ctx.db.get(staffId);
      return staff;
    }));
    return staffs;
  },
});
