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
