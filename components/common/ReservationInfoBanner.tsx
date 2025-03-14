import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Calendar } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
interface ReservationInfoBannerProps {
  salonId: string;
}

export default async function ReservationInfoBanner({
  salonId,
}: ReservationInfoBannerProps) {
  // パフォーマンス向上のため、URLを一度だけ計算
  const reservationUrl = `${process.env.NEXT_PUBLIC_URL}/reservation/${salonId}`;

  const checkLineConnection = await fetchQuery(
    api.salon_config.checkLineConnection,
    {
      salonId: salonId,
    }
  );

  console.log(checkLineConnection.success);

  return (
    <div>
      {checkLineConnection.success ? (
        <Card className="bg-green-50 border-green-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-base font-bold text-green-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              予約受付ページ
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-sm text-green-700">
              <p>以下のリンクからサロンの予約ページを確認できます。</p>
              <div className="mt-2 flex items-center">
                <Link
                  href={reservationUrl}
                  className="text-green-600 hover:text-green-800 hover:underline flex items-center transition-colors duration-200 gap-1"
                >
                  <span className="break-all">{reservationUrl}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-red-200 shadow-sm hover:shadow transition-shadow duration-200">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              LINE連携が未設定です。
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-sm">
            <div className=" text-red-500 py-3 bg-red-50 p-2 rounded-md">
              <p>LINE連携が確認できませんでした。</p>
              <p>{checkLineConnection.message}</p>
            </div>
            <p className="mt-2">
              <Link
                href={`${process.env.NEXT_PUBLIC_URL}/dashboard/${salonId}/setting`}
                className="text-red-500 hover:text-red-700 hover:underline flex items-center underline leading-5 transition-colors duration-200 gap-1"
              >
                サロンの設定画面へ
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
