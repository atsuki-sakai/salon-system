"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CalendarCheck,
  Scissors,
  CreditCard,
  Share2,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompletePage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId") as string;
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  const reservation = useQuery(api.reservation.get, {
    reservationId: reservationId as Id<"reservation">,
  });
  const salonConfig = useQuery(api.salon_config.getSalonConfig, {
    salonId: reservation?.salonId as Id<"salon">,
  });

  // プログレスバーのアニメーション
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 紙吹雪アニメーションを一定時間後に非表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // カレンダーに追加する機能
  const addToCalendar = () => {
    if (!reservation) return;

    const startDateTime = new Date(
      `${reservation.reservationDate}T${reservation.startTime}`
    );
    const endDateTime = new Date(
      `${reservation.reservationDate}T${reservation.endTime}`
    );

    // Google カレンダー用のリンクを作成
    const text = `${reservation.menuName} @ ${reservation.salonName ?? ""}`;
    const details = `予約ID: ${reservation._id}\nスタッフ: ${reservation.staffName}\n開始時間: ${reservation.startTime}\n終了時間: ${reservation.endTime}`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      text
    )}&dates=${format(startDateTime, "yyyyMMdd'T'HHmmss")}/${format(
      endDateTime,
      "yyyyMMdd'T'HHmmss"
    )}&details=${encodeURIComponent(details)}&sf=true&output=xml`;

    window.open(googleCalendarUrl, "_blank");
  };

  // 予約詳細のシェア機能
  const shareReservation = () => {
    if (!reservation) return;

    const shareText = `${reservation.salonName}に${format(new Date(reservation.reservationDate), "M月d日", { locale: ja })}の${reservation.startTime}から予約しました！`;

    if (navigator.share) {
      navigator
        .share({
          title: `${reservation.salonName}の予約完了`,
          text: shareText,
        })
        .catch(console.error);
    } else {
      // モバイルの場合はコピーする
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert("予約情報をクリップボードにコピーしました"))
        .catch(console.error);
    }
  };

  // 予約情報のダウンロード機能
  const downloadReservationDetails = () => {
    if (!reservation) return;

    const reservationDate = format(
      new Date(reservation.reservationDate),
      "yyyy年MM月dd日(E)",
      { locale: ja }
    );

    let content = `
    予約詳細 - ${reservation.salonName}
    ===============================
    予約番号: ${reservation._id}
    日付: ${reservationDate}
    時間: ${reservation.startTime}～${reservation.endTime}
    メニュー: ${reservation.menuName}
    担当スタッフ: ${reservation.staffName}
    ===============================
    料金: ${reservation.price.toLocaleString()}円
    `;

    if (reservation.selectedOptions && reservation.selectedOptions.length > 0) {
      content += "\nオプション:\n";
      reservation.selectedOptions.forEach((opt) => {
        content += `- ${opt.name}: ${opt.price.toLocaleString()}円\n`;
      });
    }

    content += `
  ===============================
  サロン情報:
  ${salonConfig?.salonName}
  住所: ${salonConfig?.address}
  電話: ${salonConfig?.phone}
  メール: ${salonConfig?.email}
  ===============================
  `;

    const blob = new Blob([content], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `予約_${reservation.reservationDate}_${salonConfig?.salonName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  // 紙吹雪アニメーションの粒子
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 100 }).map((_, i) => {
          const size = Math.random() * 8 + 5;
          const colors = [
            "#FFC700",
            "#FF0058",
            "#2E7CF6",
            "#17C964",
            "#F31260",
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;

          return (
            <motion.div
              key={i}
              className="fixed rounded-full"
              style={{
                width: size,
                height: size,
                top: -20,
                left: `${left}%`,
                backgroundColor: color,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: window.innerHeight + 20,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: animationDuration,
                delay: delay,
                ease: [0.1, 0.25, 0.75, 1],
              }}
            />
          );
        })}
      </div>
    );
  };

  // 計算関数
  const calculateTotalPrice = () => {
    if (!reservation) return 0;

    const optionsTotal =
      reservation.selectedOptions?.reduce(
        (total, opt) => total + opt.price,
        0
      ) || 0;
    return reservation.price + optionsTotal;
  };

  // 日付フォーマット関数
  const formatDateJP = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "yyyy年MM月dd日(E)", { locale: ja });
  };

  // メインのアニメーション定義
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-10">
      {/* 紙吹雪アニメーション */}
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <motion.div
        className="w-full max-w-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 成功メッセージカード */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 bg-white shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-blue-50 pb-4">
              <div className="flex justify-center mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="bg-green-100 p-3 rounded-full"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
              </div>
              <CardTitle className="text-center text-xl sm:text-2xl text-slate-800">
                予約が完了しました
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                ご予約ありがとうございます。以下に詳細をご確認ください。
                <br />
                メールアドレスにも予約完了のメールを送信していますので、ご確認ください。
              </CardDescription>
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {reservation ? (
                <>
                  {/* 予約ID */}
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500">予約ID</p>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {reservation._id}
                    </p>
                  </div>

                  {/* 日時情報 */}
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 py-3 px-4 rounded-t-xl">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4" />
                        予約日時
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-600">予約日</span>
                        </div>
                        <span className="font-medium text-slate-800">
                          {formatDateJP(reservation.reservationDate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-600">時間</span>
                        </div>
                        <span className="font-medium text-slate-800">
                          {reservation.startTime.split("T")[1]} 〜{" "}
                          {reservation.endTime.split("T")[1]}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* メニュー・担当者情報 */}
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 py-3 px-4 rounded-t-xl">
                      <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                        <Scissors className="h-4 w-4" />
                        予約内容
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            メニュー
                          </span>
                        </div>
                        <span className="font-medium text-slate-800">
                          {reservation.menuName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-600">
                            担当スタッフ
                          </span>
                        </div>
                        <span className="font-medium text-slate-800">
                          {reservation.staffName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 料金情報 */}
                  <Card className="border border-green-200 shadow-sm">
                    <CardHeader className="bg-green-50 py-3 px-4 rounded-t-xl">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                        <CreditCard className="h-4 w-4" />
                        料金
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          メニュー料金
                        </span>
                        <span className="font-medium text-slate-800">
                          ¥{reservation.price.toLocaleString()}
                        </span>
                      </div>

                      {reservation.selectedOptions &&
                        reservation.selectedOptions.length > 0 && (
                          <>
                            <Separator />
                            {reservation.selectedOptions.map(
                              (option, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm text-slate-600">
                                    {option.name}
                                  </span>
                                  <span className="font-medium text-slate-800">
                                    ¥{option.price.toLocaleString()}
                                  </span>
                                </div>
                              )
                            )}
                          </>
                        )}

                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">
                          合計
                        </span>
                        <span className="font-bold text-xl text-green-600">
                          ¥{calculateTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* サロン情報 */}
                  <Accordion
                    type="single"
                    collapsible
                    className="border rounded-lg"
                  >
                    <AccordionItem value="salon-info" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-700">
                            {salonConfig?.salonName}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <span className="text-sm text-slate-600">
                              {salonConfig?.address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <a
                              href={`tel:${salonConfig?.phone}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {salonConfig?.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <a
                              href={`mailto:${salonConfig?.email}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {salonConfig?.email}
                            </a>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              ) : (
                // ローディング表示
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
                  <p className="text-slate-600">
                    予約情報を読み込んでいます...
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-6 pt-2 gap-3 flex-col sm:flex-row">
              <Button
                className="w-full bg-slate-800 hover:bg-slate-900"
                onClick={addToCalendar}
                disabled={!reservation}
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                Googleカレンダーに追加
              </Button>
              <div className="flex gap-2 w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={shareReservation}
                        disabled={!reservation}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>予約を共有</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={downloadReservationDetails}
                        disabled={!reservation}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>予約詳細をダウンロード</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
