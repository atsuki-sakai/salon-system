import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Calendar } from "lucide-react";

interface ReservationInfoBannerProps {
  salonId: string;
}

export default function ReservationInfoBanner({
  salonId,
}: ReservationInfoBannerProps) {
  // パフォーマンス向上のため、URLを一度だけ計算
  const reservationUrl = `${process.env.NEXT_PUBLIC_URL}/reservation/${salonId}`;

  return (
    <div>
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
    </div>
  );
}
