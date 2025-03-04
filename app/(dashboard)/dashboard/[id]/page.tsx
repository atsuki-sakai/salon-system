"use client";

import {
  ReservationInfoBanner,
  NextTreatment,
  AvailableStaffList,
} from "@/components/common";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 予約受付ページ */}
      <ReservationInfoBanner />
      {/* 次の施術一覧 */}
      <NextTreatment />
      {/* 対応可能のスタッフ一覧 */}
      <AvailableStaffList />
    </div>
  );
}
