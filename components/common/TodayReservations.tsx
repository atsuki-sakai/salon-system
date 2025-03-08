"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { parseISO, format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CalendarClock,
  User,
  Scissors,
  MessageSquare,
  Phone,
  CalendarCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function TodayReservations({ salonId }: { salonId: string }) {
  // 日本時間で本日の日付を取得（YYYY-MM-DD形式）
  const getTodayInJST = (): string => {
    // 日本時間のタイムゾーンオフセットを指定して日付を取得
    const now = new Date();
    // 日本のタイムゾーンオフセット（+9時間）を考慮
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    // ローカルの日付文字列から日付部分のみを抽出（YYYY-MM-DD形式）
    return jstDate.toISOString().split("T")[0]!;
  };

  const today: string = getTodayInJST();
  // デバッグ用に固定日付を使用する場合はコメントを外す
  // const today = "2025-03-08";

  const reservations = useQuery(api.reservation.getReservationsByDate, {
    salonId,
    date: today!,
  });

  // 開始時刻で昇順にソート、最新10件のみ抽出
  const upcomingReservations = reservations
    ? reservations
        .sort(
          (a, b) =>
            parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
        )
        .slice(0, 10)
    : [];

  // 状態に応じたバッジの色を設定する関数
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge
            className="bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap"
            variant="outline"
          >
            <CalendarCheck className="h-3 w-3 mr-1" />
            確定済み
          </Badge>
        );
      case "canceled":
        return (
          <Badge
            variant="destructive"
            className="hover:bg-red-600 whitespace-nowrap"
          >
            <X className="h-3 w-3 mr-1" />
            キャンセル
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200 bg-orange-50 whitespace-nowrap"
          >
            未確定
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="whitespace-nowrap">
            {status}
          </Badge>
        );
    }
  };

  // 時間をフォーマットする関数
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), "HH:mm", { locale: ja });
  };

  // 予約時間を計算（時間）
  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    return `${durationMinutes}分`;
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight">本日の予約</h2>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
          <CalendarClock className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-base font-bold text-slate-700 whitespace-nowrap">
            {format(new Date(), "yyyy年MM月dd日 (EEE)", { locale: ja })}
          </span>
        </div>
      </div>

      {upcomingReservations.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <CalendarClock className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">本日の予約はありません</p>
            <p className="text-gray-400 text-sm mt-1">
              現在以降の予約はこちらに表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingReservations.map((reservation) => (
            <Card
              key={reservation._id}
              className="overflow-hidden border-gray-200 transition-all hover:shadow-md flex flex-col"
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0 p-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <CardTitle className="font-bold text-gray-800 mb-1 line-clamp-1">
                      {reservation.menuName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium text-indigo-600 whitespace-nowrap">
                        {formatTime(reservation.startTime)} -{" "}
                        {formatTime(reservation.endTime)}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        (
                        {calculateDuration(
                          reservation.startTime,
                          reservation.endTime
                        )}
                        )
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 pb-2 flex-grow p-2">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">担当スタッフ</p>
                        <p className="font-medium truncate">
                          {reservation.staffName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">お客様</p>
                        <p className="font-medium truncate">
                          {reservation.customerName}
                        </p>
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="bg-gray-50 p-2 rounded-md mt-2">
                        <div className="flex gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 break-words">
                            {reservation.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <Separator className="my-1" />

              <CardFooter className="flex flex-col sm:flex-row sm:justify-between bg-gray-50 p-3 gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Scissors className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">
                    ¥{reservation.price.toLocaleString()}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-full sm:w-auto"
                >
                  <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <a
                    href={`tel:${reservation.customerPhone}`}
                    className="truncate tracking-wide"
                  >
                    {reservation.customerPhone}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
