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
import { motion } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// AnimatedCard コンポーネント
const AnimatedCard = motion(Card);

export default function TodayReservations({ salonId }: { salonId: string }) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // 日本時間で本日の日付を取得（パフォーマンス向上のためuseMemoを使用）
  const { today, todayFormattedString, currentJSTTimestamp } = useMemo(() => {
    // 日本時間のタイムゾーンオフセットを指定して日付を取得
    const now = new Date();

    // 日付文字列を生成する関数
    const padZero = (num: number): string => num.toString().padStart(2, "0");
    const dateString = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;

    // 日本語フォーマットの日付
    const formattedString = format(now, "yyyy年MM月dd日 (EEE)", { locale: ja });

    // 現在のタイムスタンプ
    const timeString = `${dateString}T${padZero(now.getHours())}:${padZero(now.getMinutes())}`;

    return {
      today: dateString,
      todayFormattedString: formattedString,
      currentJSTTimestamp: new Date(timeString).getTime(),
    };
  }, []);

  // 時間をフォーマットする関数
  const formatTime = useCallback((timeString: string) => {
    return format(new Date(timeString), "HH:mm", { locale: ja });
  }, []);

  // 予約時間を計算（時間）
  const calculateDuration = useCallback((start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    return `${durationMinutes}分`;
  }, []);

  // 状態に応じたバッジの色を設定する関数
  const getStatusBadge = useCallback((status: string) => {
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
            <CalendarClock className="h-3 w-3 mr-1" />
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
  }, []);

  // 予約データの取得
  const reservations = useQuery(api.reservation.getReservationsByDate, {
    salonId,
    date: today,
  });

  // 開始時刻で昇順にソート、最新10件のみ抽出、現在時刻以降のみ
  const upcomingReservations = useMemo(() => {
    if (!reservations) return [];

    return reservations
      .sort(
        (a, b) =>
          parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      )
      .filter(
        (reservation) =>
          new Date(reservation.startTime).getTime() >= currentJSTTimestamp
      )
      .slice(0, 10);
  }, [reservations, currentJSTTimestamp]);

  // コンテナのアニメーション設定
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // カードのアニメーション設定
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2"
      >
        <h2 className="text-2xl text-slate-800 font-bold tracking-tight flex items-center">
          今日の予約
        </h2>
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 sm:ml-2 w-fit"
        >
          <CalendarClock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <span className="text-base font-bold text-indigo-700 whitespace-nowrap">
            {todayFormattedString}
          </span>
        </motion.div>
      </motion.div>

      {/* ローディング状態 */}
      {reservations === undefined && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="overflow-hidden border-gray-200">
              <CardHeader className="pb-2 p-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pt-4 pb-2 p-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 予約がない場合 */}
      {reservations && upcomingReservations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-tr from-slate-50 to-indigo-50 border border-dashed">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                }}
                className="relative"
              >
                {/* 別々のモーションで回転を実装 */}
                <motion.div
                  animate={{ rotate: 10 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 2,
                  }}
                >
                  <CalendarClock className="h-16 w-16 text-indigo-300 mb-4" />
                </motion.div>
              </motion.div>
              <p className="text-indigo-700 font-medium text-lg">
                本日の予約はありません
              </p>
              <p className="text-indigo-400 text-sm mt-2">
                現在以降の予約はこちらに表示されます
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 予約カードのグリッド */}
      {reservations && upcomingReservations.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {upcomingReservations.map((reservation) => (
            <motion.div key={reservation._id} variants={cardVariants}>
              <AnimatedCard
                onMouseEnter={() => setHoveredCardId(reservation._id)}
                onMouseLeave={() => setHoveredCardId(null)}
                whileHover={{
                  y: -5,
                  boxShadow: "0 12px 20px rgba(0, 0, 0, 0.1)",
                  borderColor: "rgba(79, 70, 229, 0.3)",
                }}
                className={`overflow-hidden border-gray-200 transition-all flex flex-col h-full ${
                  hoveredCardId === reservation._id ? "border-indigo-200" : ""
                }`}
              >
                <CardHeader className="pb-2 bg-gradient-to-r from-indigo-100 to-blue-50 flex-shrink-0 p-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="font-bold text-gray-800 mb-1 line-clamp-1">
                        {reservation.menuName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
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

                <CardContent className="pt-4 pb-2 flex-grow p-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 group">
                        <div className="p-1.5 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                          <Scissors className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">担当スタッフ</p>
                          <p className="font-medium truncate text-indigo-700">
                            {reservation.staffName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 group">
                        <div className="p-1.5 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                          <User className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">お客様</p>
                          <p className="font-medium truncate text-gray-700">
                            {reservation.customerFullName}
                          </p>
                        </div>
                      </div>

                      {reservation.notes && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.3 }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-md mt-2 border border-blue-100"
                        >
                          <div className="flex gap-2">
                            <MessageSquare className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 break-words">
                              {reservation.notes}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardContent>

                <Separator className="my-1" />

                <CardFooter className="flex flex-col sm:flex-row sm:justify-between bg-gray-50 p-3 gap-3 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border">
                          <Scissors className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                          <span className="font-medium text-indigo-700">
                            ¥{reservation.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>施術料金</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-full sm:w-auto bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-200 text-indigo-700"
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
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}