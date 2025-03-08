"use client";

import { ReservationInfoBanner } from "@/components/common";
import { PersonStanding, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function DashboardPage() {
  const { id } = useParams();
  return (
    <div className="flex flex-col gap-4">
      {/* 予約受付ページ */}
      <ReservationInfoBanner />
      {/* 使用方法 */}
      <div className=" p-4 rounded-lg bg-gray-50">
        <h4 className="text-2xl font-bold">使用方法</h4>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <ul className="list-disc pl-5 space-y-2 my-5 text-sm tracking-wide">
              <li>
                <p>
                  まず、
                  <Link href={`/dashboard/${id}/staff`}>
                    <PersonStanding className="inline-block" />
                    スタッフ
                  </Link>
                  を作成します。
                </p>
              </li>
              <li>
                <p>
                  次に、
                  <Link href={`/dashboard/${id}/menu`}>
                    {" "}
                    <FileText className="inline-block" />
                    メニュー
                  </Link>
                  を作成します。
                </p>
              </li>
              <li>
                <p>
                  予約の確認は
                  <Link href={`/dashboard/${id}/calendar`}>
                    <Calendar className="inline-block" />
                    予約カレンダー
                  </Link>
                  から確認できます。
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* サロンの本日の予約を現在以降で直近に対応する最新の10件表示 */}
      <div className=" p-4 rounded-lg bg-gray-50">
        <h4 className="text-2xl font-bold">サロンの本日の予約</h4>
        <div className="flex flex-col gap-4"></div>
      </div>
    </div>
  );
}
