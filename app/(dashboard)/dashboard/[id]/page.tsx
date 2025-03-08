"use client";

import { ReservationInfoBanner } from "@/components/common";
import { Separator } from "@/components/ui/separator";
import TodayReservations from "@/components/common/TodayReservations";
import { useParams } from "next/navigation";
export default function DashboardPage() {
  const { id } = useParams();
  return (
    <div className="flex flex-col gap-4">
      {/* 予約受付ページ */}
      <ReservationInfoBanner />
      <Separator className="my-4 w-[50%] mx-auto" />
      <TodayReservations salonId={id as string} />
    </div>
  );
}
