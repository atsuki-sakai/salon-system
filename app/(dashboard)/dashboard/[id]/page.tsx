"use client";

import { ReservationInfoBanner } from "@/components/common";
import { Separator } from "@/components/ui/separator";
import TodayReservations from "@/components/common/TodayReservations";
import { useParams } from "next/navigation";
import { useSalonCore } from "@/hooks/useSalonCore";
export default function DashboardPage() {
  const { id } = useParams();
  const { isSubscribed } = useSalonCore();

  console.log("isSubscribed: ", isSubscribed);

  return (
    <div className="flex flex-col gap-4">
      {/* 予約受付ページ */}

      {isSubscribed ? (
        <>
          <ReservationInfoBanner />
          <Separator className="my-4 w-[50%] mx-auto" />
          <TodayReservations salonId={id as string} />
        </>
      ) : (
        <div className="text-center text-sm text-gray-500 min-h-[500px] flex items-center justify-center">
          サブスクリプション契約が必要です。
        </div>
      )}
    </div>
  );
}
