import { Id } from "@/convex/_generated/dataModel";

export type TimeSlot = {
    date: string | undefined;
    staffId: Id<"staff">;
    staffName: string;
    startTime: string;
    endTime: string;
  };

  export type CustomerSession = {
    _id: Id<"customer">;
    lineId: string | undefined;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };

  export type MenuOption = {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    maxCount?: number;
  }

  // スタッフ認証関連の型定義
  export type StaffRole = "admin" | "manager" | "staff";

  export type StaffAuthData = {
    staffId: Id<"staff">;
    salonId: string;
    name?: string;
    role: StaffRole;
  };
  
  export type StaffLoginCredentials = {
    email: string;
    pin: string;
    salonId: string;
  };
  
  export type StaffProfile = {
    _id: Id<"staff">;
    name?: string;
    email?: string;
    role?: StaffRole;
    salonId: string;
    isActive?: boolean;
    gender?: "全て" | "男性" | "女性";
    age?: number;
    extraCharge?: number;
    description?: string;
    imgFileId?: string;
    regularHolidays?: string[];
  };
