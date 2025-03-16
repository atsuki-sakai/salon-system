import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// 注意：ConvexではESM形式でのインポートが必要
import bcryptjs from "bcryptjs";

// PINコードをハッシュ化する関数 - アクション関数内でのみ使用
async function hashPin(pin: string): Promise<string> {
  return await bcryptjs.hash(pin, 10);
}

// PINコード検証関数 - アクション関数内でのみ使用
async function verifyPinCode(plainPin: string, hashedPin: string): Promise<boolean> {
  return await bcryptjs.compare(plainPin, hashedPin);
}

// スタッフログイン - メールアドレスの検証
export const verifyEmail = mutation({
  args: {
    email: v.string(),
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db
      .query("staff")
      .filter((q) => 
        q.and(
          q.eq(q.field("salonId"), args.salonId),
          q.eq(q.field("email"), args.email),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (!staff) {
      throw new ConvexError({message: "メールアドレスが見つかりません"});
    }

    return {
      staffId: staff._id,
      name: staff.name,
    };
  },
});

// スタッフログイン - PINコードの検証
export const verifyPin = action({
  args: {
    staffId: v.id("staff"),
    pin: v.string(),
  },
  handler: async (ctx, args): Promise<{ staffId: Id<'staff'>; name: string; role: string; salonId: string }> => {
    const staffId = args.staffId;
    
    // スタッフ情報を取得
    const staff = await ctx.runQuery(api.staff_auth.getStaffById, {
      staffId: staffId
    });
    
    if (!staff || !staff.pinCode) {
      throw new ConvexError({message: "スタッフが見つかりません"});
    }
    
    // PINコードの検証 - アクション内でbcryptjsを使用
    const isValid = await verifyPinCode(args.pin, staff.pinCode);
    
    if (!isValid) {
      throw new ConvexError({message: "PINコードが正しくありません"});
    }
    
    return {
      staffId: staff._id,
      name: staff.name || "",
      role: staff.role || "staff", // デフォルトはstaffロール
      salonId: staff.salonId,
    };
  },
});

export const getStaffPinCode = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new ConvexError({message: "スタッフが見つかりません"});
    }
    return staff?.pinCode;
  },
});


// スタッフの取得 - 内部クエリ用
export const getStaffById = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.staffId);
  },
});

// スタッフ情報の取得（認証後に使用）
export const getStaffProfile = query({
  args: {
    staffId: v.id("staff"),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.staffId);
    
    if (!staff) {
      throw new ConvexError({message: "スタッフが見つかりません"});
    }
    
    // パスワードハッシュなど機密情報を除外
    const { ...staffProfile } = staff;
    
    return staffProfile;
  },
});

// スタッフのPINコード設定/更新
export const updateStaffPin = action({
  args: {
    staffId: v.id("staff"),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    // スタッフの存在確認
    const staff = await ctx.runQuery(api.staff_auth.getStaffById, {
      staffId: args.staffId
    });
    
    if (!staff) {
      throw new ConvexError({message: "スタッフが見つかりません"});
    }
    
    // PINコードをハッシュ化 - アクション内でbcryptjsを使用
    const hashedPin = await hashPin(args.pin);
    
    // ハッシュ化されたPINを保存
    await ctx.runMutation(api.staff_auth.saveHashedPin, {
      staffId: args.staffId,
      hashedPin
    });
    
    return { success: true };
  },
});

// ハッシュ化されたPINを保存するミューテーション
export const saveHashedPin = mutation({
  args: {
    staffId: v.id("staff"),
    hashedPin: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.staffId, {
      pinCode: args.hashedPin,
    });
    return { success: true };
  },
});

// スタッフのログイン情報を更新（メール、権限、アクティブ状態）
export const updateStaffLoginInfo = mutation({
  args: {
    staffId: v.id("staff"),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.db.get(args.staffId);
    
    if (!staff) {
      throw new ConvexError({message: "スタッフが見つかりません"});
    }
    
    const updates: Record<string, unknown> = {};
    
    // メールアドレスが変更される場合は重複チェック
    if (args.email !== undefined && args.email !== staff.email) {
      // 同じサロン内で同じメールアドレスを持つ他のスタッフがいないか確認
      const duplicateStaff = await ctx.db
        .query("staff")
        .filter(q => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("salonId"), staff.salonId),
            q.neq(q.field("_id"), args.staffId)
          )
        )
        .first();
      
      if (duplicateStaff) {
        throw new ConvexError({message: "このメールアドレスは既に他のスタッフによって使用されています"});
      }
      
      updates.email = args.email;
    } else if (args.email !== undefined) {
      updates.email = args.email;
    }
    
    if (args.role !== undefined) {
      updates.role = args.role;
    }
    
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.staffId, updates);
    }
    
    return { success: true };
  },
});

// スタッフのロール(権限)一覧取得
export const getStaffRoles = query({
  args: {
    salonId: v.string(),
  },
  handler: async (ctx, args) => {
    const staffs = await ctx.db
      .query("staff")
      .filter((q) => q.eq(q.field("salonId"), args.salonId))
      .collect();
    
    return staffs.map((staff) => ({
      staffId: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role || "staff", // デフォルトはstaffロール
      isActive: staff.isActive ?? false,
    }));
  },
});