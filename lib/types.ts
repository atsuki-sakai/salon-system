import { Id } from "@/convex/_generated/dataModel";

export type TimeSlot = {
    date: string | undefined;
    staffId: Id<"staff">;
    staffName: string;
    startTime: string;
    endTime: string;
  };