"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addDays,
  subDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Loading } from "@/components/common";
// Shadcn UI コンポーネント
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// アイコン
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Phone,
  Plus,
  Users,
  User,
  Info,
  CalendarClock,
  ClipboardList,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  ChartGantt,
} from "lucide-react";
import {
  FaPhone,
  FaUserClock,
  FaRegStickyNote,
  FaSpa,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdToday, MdEventAvailable } from "react-icons/md";
import { IoMdTime } from "react-icons/io";

// カラーパレット（より洗練されたカラー）
const colorPalette = [
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-lime-100 border-lime-300 text-lime-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-sky-100 border-sky-300 text-sky-800",
  "bg-violet-100 border-violet-300 text-violet-800",
];

// クラス名を結合するユーティリティ
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes
    .filter((cls): cls is string => typeof cls === "string")
    .join(" ");
}

// カレンダー用の日付データを生成する関数
function getCalendarDays(date: Date, selectedDate: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 }); // 月曜始まり
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isToday(day),
    isSelected: isSameDay(day, selectedDate),
    day: getDay(day),
  }));
}

// スタッフのIDからハッシュ値を算出し、色を返す関数
function getStaffColorFromId(id: string, index: number): string {
  return colorPalette[index % colorPalette.length] ?? colorPalette[0]!;
}

// 時間テキストを取得する関数
function getTimeText(hour: number): string {
  return `${hour}時`;
}

// 時間文字列から分数に変換する関数
function getMinutesFromTime(timeString: string) {
  const date = parseISO(timeString);
  return date.getHours() * 60 + date.getMinutes();
}

// アニメーション変数
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export default function Calendar() {
  const params = useParams();
  const salonId = params.id as string;

  // 状態
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [filteredReservations, setFilteredReservations] = useState<
    Doc<"reservation">[]
  >([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Doc<"reservation"> | null>(null);
  const [view, setView] = useState<"timeline" | "list">("timeline");

  // コンテナ参照
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  // データの取得（useQuery は結果をメモ化する）
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });
  const menus = useQuery(api.menu.getMenusBySalonId, {
    salonId,
    paginationOpts: { numItems: 1000, cursor: null },
  });
  const reservations = useQuery(api.reservation.getReservationsByDate, {
    salonId,
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  // 最適化されたモデル
  const staffColorMap = useMemo(() => {
    if (!staffs) return new Map();
    const map = new Map<string, string>();
    staffs.forEach((staff, index) => {
      map.set(staff._id, getStaffColorFromId(staff._id, index));
    });
    return map;
  }, [staffs]);

  // 日付操作ハンドラ（useCallbackで最適化）
  const handlePrevDay = useCallback(() => {
    setSelectedDate((prev) => subDays(prev, 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleDateSelect = useCallback((date: string | Date) => {
    if (typeof date === "string") {
      setSelectedDate(parseISO(date));
    } else {
      setSelectedDate(date);
    }
  }, []);

  const handleShowReservation = useCallback(
    (reservationId: string) => {
      const reservation = reservations?.find(
        (reservation) => reservation._id === reservationId
      );
      if (reservation) {
        setSelectedReservation(reservation);
      } else {
        setSelectedReservation(null);
      }
    },
    [reservations]
  );

  // カレンダー日付の生成（メモ化）
  const days = useMemo(
    () => getCalendarDays(currentMonth, selectedDate),
    [currentMonth, selectedDate]
  );

  // フィルタリングされた予約のメモ化
  useEffect(() => {
    if (selectedStaffId === "all") {
      setFilteredReservations(reservations ?? []);
    } else {
      const filtered = reservations?.filter(
        (reservation) => reservation.staffId === selectedStaffId
      );
      setFilteredReservations(filtered ?? []);
    }
  }, [reservations, selectedStaffId]);

  // スタッフごとのカラムマッピングの生成（メモ化）
  const staffColumnMap = useMemo(() => {
    const map = new Map<string, number>();
    if (staffs) {
      staffs.forEach((staff, index) => {
        map.set(staff._id, index + 1);
      });
    }
    return map;
  }, [staffs]);

  // グリッドのカラム数を計算（メモ化）
  const numCols = useMemo(() => {
    return selectedStaffId === "all" ? (staffs?.length ?? 1) : 1;
  }, [selectedStaffId, staffs?.length]);

  const gridTemplateColumns = useMemo(
    () => `repeat(${numCols}, minmax(0, 1fr))`,
    [numCols]
  );

  // スクロール位置の初期化
  useEffect(() => {
    if (
      !container.current ||
      !containerNav.current ||
      !containerOffset.current
    ) {
      return;
    }

    // 現在の時間に応じてスクロール位置を設定（朝9時から営業の場合は9時付近にスクロール）
    const currentHour = new Date().getHours();
    const targetHour = Math.max(9, Math.min(currentHour, 20)); // 9時〜20時の間で調整
    const currentMinute = targetHour * 60;

    container.current.scrollTop =
      ((container.current.scrollHeight -
        containerNav.current.offsetHeight -
        containerOffset.current.offsetHeight) *
        currentMinute) /
      1440;
  }, [selectedDate]);

  // 予約データをグループ化（リスト表示用）
  const reservationsByStaff = useMemo(() => {
    const grouped: Record<string, Doc<"reservation">[]> = {};

    if (filteredReservations) {
      filteredReservations.forEach((reservation) => {
        if (!grouped[reservation.staffId]) {
          grouped[reservation.staffId] = [];
        }
        grouped[reservation.staffId]?.push(reservation);
      });

      // 各スタッフの予約を時間順にソート
      Object.keys(grouped).forEach((staffId) => {
        if (grouped[staffId]) {
          grouped[staffId].sort((a, b) => {
            return (
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
          });
        }
      });
    }

    return grouped;
  }, [filteredReservations]);

  // ローディング表示
  if (
    staffs === undefined ||
    menus === undefined ||
    reservations === undefined
  ) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <motion.div
      className="flex h-full flex-col bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ヘッダー - モダンなデザインに更新 */}
      <motion.header
        className="flex flex-none items-center justify-between border-b border-gray-200 px-4 py-4 md:px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <motion.h1
            className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <time dateTime={format(selectedDate, "yyyy-MM-dd")}>
                {format(selectedDate, "yyyy年M月d日", { locale: ja })}
              </time>
              <motion.p
                className="mt-1 text-sm text-gray-500 flex items-center gap-1.5"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {format(selectedDate, "EEEE", { locale: ja })}
              </motion.p>
            </div>
          </motion.h1>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "timeline" | "list")}
              className="w-full"
            >
              <TabsList className="grid w-[200px] grid-cols-2 shadow-sm">
                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-1 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-800 data-[state=active]:border-indigo-800"
                >
                  <ChartGantt className="h-3.5 w-3.5" />
                  タイムライン
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="flex items-center gap-1 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-800 data-[state=active]:border-indigo-800"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  リスト
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/dashboard/${salonId}/reservation/create`}>
                    <Button
                      size="sm"
                      className="gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">新規予約</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-indigo-800 text-white border-none"
                >
                  <p>新しい予約を作成</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="flex items-center">
              <Select
                value={selectedStaffId}
                onValueChange={(value) => setSelectedStaffId(value as string)}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm border-indigo-100 focus:ring-indigo-500 bg-white shadow-sm rounded-full">
                  <SelectValue placeholder="全スタッフ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <p>全スタッフ</p>
                    </div>
                  </SelectItem>
                  {staffs?.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <p>{staff.name}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center rounded-full border bg-white shadow-sm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevDay}
                className="h-8 w-8 rounded-l-full border-r text-gray-500 hover:bg-indigo-50 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToday}
                className="h-8 px-3 text-xs font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              >
                <MdToday className="h-3.5 w-3.5" />
                今日
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextDay}
                className="h-8 w-8 rounded-r-full border-l text-gray-500 hover:bg-indigo-50 flex items-center justify-center"
              >
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* メインコンテンツ */}
      <div className="isolate flex flex-auto overflow-hidden bg-white">
        {/* モバイル用カレンダー - デザイン改善 */}
        <motion.div
          className="w-full md:hidden p-4 border-b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevMonth}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <FaCalendarAlt className="h-4 w-4 text-indigo-600" />
              {format(currentMonth, "yyyy年M月", { locale: ja })}
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextMonth}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs mb-1 font-medium">
            <div className="text-indigo-800">月</div>
            <div className="text-indigo-800">火</div>
            <div className="text-indigo-800">水</div>
            <div className="text-indigo-800">木</div>
            <div className="text-indigo-800">金</div>
            <div className="text-indigo-800">土</div>
            <div className="text-indigo-800">日</div>
          </div>

          <div className="grid grid-cols-7 gap-1 rounded-lg text-sm">
            {days.map((day) => (
              <motion.button
                key={day.date}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDateSelect(day.date)}
                className={classNames(
                  "flex items-center justify-center aspect-square rounded-full transition-all duration-200",
                  day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                  day.isSelected &&
                    "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md",
                  day.isToday &&
                    !day.isSelected &&
                    "text-indigo-600 border-2 border-indigo-400",
                  !day.isSelected && "hover:bg-indigo-50"
                )}
              >
                {day.date?.split("-").pop()?.replace(/^0/, "") ?? ""}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* タイムライン表示 */}
        <AnimatePresence mode="wait">
          {view === "timeline" && (
            <motion.div
              key="timeline"
              ref={container}
              className="flex flex-auto flex-col overflow-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div
                ref={containerNav}
                className="sticky top-0 z-10 bg-white flex-none"
              ></div>
              <div className="flex w-full flex-auto">
                <div className="w-14 flex-none ring-1 ring-gray-100" />
                <div className="grid flex-auto grid-cols-1 grid-rows-1">
                  {/* 時間ルーラー - デザイン改善 */}
                  <div
                    className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                    style={{
                      gridTemplateRows: "repeat(24, minmax(3.5rem, 1fr))",
                    }}
                  >
                    <div ref={containerOffset} className="row-end-1 h-7"></div>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour}>
                        <div>
                          <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs font-medium text-indigo-800">
                            {getTimeText(hour)}
                          </div>
                        </div>
                        <div />
                      </div>
                    ))}
                  </div>

                  {/* 予約表示 - 視覚的改善 */}
                  <ol
                    className="col-start-1 col-end-2 row-start-1 grid"
                    style={{
                      gridTemplateRows:
                        "1.75rem repeat(288, minmax(0, 1fr)) auto",
                      gridTemplateColumns: gridTemplateColumns,
                    }}
                  >
                    {staffs && selectedStaffId === "all" && (
                      <>
                        {/* スタッフ名のヘッダー行 - デザイン改善 */}
                        {staffs.map((staff, index) => (
                          <motion.div
                            key={staff._id}
                            className={`sticky top-0 z-20 col-start-1 row-start-1 p-1.5 text-xs font-bold  shadow-md rounded-b-lg mx-0.5 ${getStaffColorFromId(staff._id, index)}`}
                            style={{ gridColumn: index + 1 }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <div className={`flex items-center justify-center`}>
                              <User className="h-3 w-3 mr-1" />
                              {staff.name}
                            </div>
                          </motion.div>
                        ))}
                      </>
                    )}

                    {/* 現在時刻のインジケーター - 視覚性向上 */}
                    {isSameDay(selectedDate, new Date()) && (
                      <div
                        className="col-start-1 col-end-[99] row-start-1 flex items-center"
                        style={{
                          gridRow: `${
                            Math.floor(
                              (new Date().getHours() * 60 +
                                new Date().getMinutes()) /
                                5
                            ) + 2
                          }`,
                        }}
                      >
                        <div className="w-full border-t-2 border-red-500 relative">
                          <div className="absolute -top-1.5 -left-2 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-300" />
                          <div className="absolute -top-6 -left-2 text-xs font-medium text-red-600 bg-white/90 px-1.5 py-0.5 rounded-md shadow-sm">
                            現在
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 予約カード - デザイン改善とアニメーション強化 */}
                    <AnimatePresence>
                      {filteredReservations.map((reservation, idx) => {
                        const startMinutes = getMinutesFromTime(
                          reservation.startTime
                        );
                        const endMinutes = getMinutesFromTime(
                          reservation.endTime
                        );
                        const duration = endMinutes - startMinutes;
                        const reservationStyle: React.CSSProperties = {
                          gridRow: `${Math.floor(startMinutes / 5) + 2} / span ${Math.floor(duration / 5)}`,
                        };

                        if (selectedStaffId === "all") {
                          const col = staffColumnMap.get(reservation.staffId);
                          if (col) {
                            reservationStyle.gridColumn = col;
                          }
                        }

                        const colorClass =
                          staffColorMap.get(reservation.staffId) ||
                          colorPalette[0];

                        return (
                          <motion.li
                            key={reservation._id}
                            className="relative mt-px flex"
                            style={reservationStyle}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <motion.button
                                  whileHover={{
                                    scale: 1.02,
                                    y: -1,
                                    boxShadow:
                                      "0 4px 12px rgba(79, 70, 229, 0.15)",
                                  }}
                                  whileTap={{ scale: 0.98 }}
                                  type="button"
                                  onClick={() =>
                                    handleShowReservation(reservation._id)
                                  }
                                  className={`${colorClass} group absolute inset-1 flex flex-col overflow-y-auto rounded-lg border-2 p-2 text-xs shadow-sm transition-all duration-300 hover:shadow-md hover:border-opacity-80`}
                                >
                                  <div className="font-bold text-start">
                                    {reservation.menuName}
                                  </div>
                                  <div className="text-xs mt-1 flex items-center gap-1">
                                    <User className="h-3 w-3 opacity-70" />
                                    {reservation.staffName}
                                  </div>
                                  <div className="font-semibold my-1 flex items-center gap-1">
                                    <IoMdTime className="h-3 w-3" />
                                    {format(
                                      parseISO(reservation.startTime),
                                      "HH:mm"
                                    )}
                                    <span className="mx-0.5">~</span>
                                    {format(
                                      parseISO(reservation.endTime),
                                      "HH:mm"
                                    )}
                                  </div>
                                  <div className="font-medium mt-auto text-start">
                                    {reservation.customerFullName}
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {reservation.customerPhone}
                                  </div>
                                </motion.button>
                              </PopoverTrigger>
                              <PopoverContent
                                className={`${colorClass} w-80 p-0 border-2 overflow-hidden rounded-xl shadow-lg`}
                              >
                                {selectedReservation && (
                                  <div className="space-y-0">
                                    <div className="border-b p-3  backdrop-blur-sm">
                                      <div className=" mb-1 text-xs flex items-center gap-1 font-normal">
                                        <FaSpa className="h-2.5 w-2.5" />
                                        メニュー
                                      </div>
                                      <h5 className="text-lg font-bold">
                                        {selectedReservation.menuName}
                                      </h5>
                                    </div>

                                    <div className="flex items-center justify-between border-b p-3 ">
                                      <div>
                                        <div className=" mb-1 text-xs flex items-center gap-1 font-normal">
                                          <FaUserClock className="h-2.5 w-2.5" />
                                          スタッフ
                                        </div>
                                        <p className="font-semibold">
                                          {selectedReservation.staffName}
                                        </p>
                                      </div>

                                      <div className="text-right ">
                                        <div className=" mb-1 text-xs flex items-center gap-1 font-normal">
                                          <CalendarClock className="h-2.5 w-2.5" />
                                          時間
                                        </div>
                                        <p className="font-semibold">
                                          {format(
                                            parseISO(
                                              selectedReservation.startTime
                                            ),
                                            "HH:mm"
                                          )}{" "}
                                          ~
                                          {format(
                                            parseISO(
                                              selectedReservation.endTime
                                            ),
                                            "HH:mm"
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2 border-b p-3 ">
                                      <div className=" mb-1 text-xs flex items-center gap-1 font-normal">
                                        <User className="h-2.5 w-2.5" />
                                        顧客情報
                                      </div>
                                      <p className="font-semibold text-lg">
                                        {selectedReservation.customerFullName}{" "}
                                        様
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <FaPhone className="h-3 w-3" />
                                        <a
                                          href={`tel:${selectedReservation.customerPhone}`}
                                          className="font-mono"
                                        >
                                          {selectedReservation.customerPhone}
                                        </a>
                                      </p>
                                    </div>

                                    <div className="p-3">
                                      <div className=" mb-1 text-xs flex items-center gap-1 font-normal">
                                        <FaRegStickyNote className="h-2.5 w-2.5" />
                                        備考
                                      </div>
                                      <p className="text-sm min-h-12 p-2 rounded-md">
                                        {selectedReservation.notes ||
                                          "特になし"}
                                      </p>
                                    </div>

                                    <div className="p-3 flex justify-end border-t bg-white/20">
                                      <Link
                                        href={`/dashboard/${salonId}/reservation/edit/${selectedReservation._id}`}
                                      >
                                        <Button
                                          size="sm"
                                          className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                          予約を編集
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}

          {/* リスト表示 - デザイン改善 */}
          {view === "list" && (
            <motion.div
              key="list"
              className="w-full overflow-auto p-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {Object.keys(reservationsByStaff).length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-12 text-gray-500"
                  variants={itemVariants}
                >
                  <div className="bg-indigo-50 rounded-full p-6 mb-6">
                    <BookOpen className="h-16 w-16 text-indigo-400" />
                  </div>
                  <p className="text-lg font-medium">予約はありません</p>
                  <p className="text-sm">この日の予約は登録されていません</p>
                  <Link
                    href={`/dashboard/${salonId}/reservation/create`}
                    className="mt-6"
                  >
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md flex gap-2 items-center px-4 rounded-full"
                    >
                      <MdEventAvailable className="h-4 w-4" />
                      新しい予約を作成
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(reservationsByStaff).map(
                    ([staffId, reservations], index) => {
                      const staff = staffs.find((s) => s._id === staffId);
                      if (!staff) return null;

                      const colorClass = staffColorMap.get(staffId) || "";
                      const baseColor = colorClass.split(" ")[0]; // bg-color 部分を抽出

                      return (
                        <motion.div
                          key={staffId}
                          className="bg-white rounded-xl shadow-md border overflow-hidden"
                          variants={itemVariants}
                          custom={index}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div
                            className={`${baseColor} px-4 py-3 flex items-center justify-between bg-gradient-to-r from-[${baseColor}] to-white/80`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="bg-white/80 rounded-full p-1.5">
                                <User className="h-4 w-4 text-indigo-700" />
                              </div>
                              <h3 className="font-bold">{staff.name}</h3>
                              <Badge className="bg-green-100 text-green-800 border-none shadow-sm ml-2">
                                {reservations.length}件
                              </Badge>
                            </div>
                          </div>

                          <div className="divide-y">
                            {reservations.map((reservation, idx) => (
                              <motion.div
                                key={reservation._id}
                                className="p-4 hover:bg-gray-50 transition-colors duration-200"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                whileHover={{
                                  backgroundColor: "rgba(245, 245, 255, 0.8)",
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-indigo-100 text-indigo-800 border-none shadow-sm">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {format(
                                          parseISO(reservation.startTime),
                                          "HH:mm"
                                        )}
                                        <span className="mx-0.5">~</span>
                                        {format(
                                          parseISO(reservation.endTime),
                                          "HH:mm"
                                        )}
                                      </Badge>
                                      <h4 className="font-semibold">
                                        {reservation.menuName}
                                      </h4>
                                    </div>

                                    <div className="mt-3 flex flex-col">
                                      <span className="font-medium flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-indigo-600" />
                                        {reservation.customerFullName} 様
                                      </span>
                                      <span className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {reservation.customerPhone}
                                      </span>
                                    </div>

                                    {reservation.notes && (
                                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                                          <Info className="h-3 w-3" />
                                          メモ:
                                        </div>
                                        {reservation.notes}
                                      </div>
                                    )}
                                  </div>

                                  <Link
                                    href={`/dashboard/${salonId}/reservation/edit/${reservation._id}`}
                                  >
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="h-8 w-8 rounded-full bg-gray-100 hover:bg-indigo-100 flex items-center justify-center transition-colors duration-200"
                                    >
                                      <Edit className="h-4 w-4 text-indigo-600" />
                                    </motion.button>
                                  </Link>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* デスクトップ用サイドカレンダー - デザイン改善 */}
        <div className="hidden w-1/3 max-w-md flex-none border-l border-gray-100 py-6 md:block">
          <motion.div
            className="px-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between text-center mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendarAlt className="h-4 w-4 text-indigo-600" />
                {format(currentMonth, "yyyy年M月", { locale: ja })}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNextMonth}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="mt-4 grid grid-cols-7 text-center text-xs leading-6 text-slate-800 font-medium">
              <div>月</div>
              <div>火</div>
              <div>水</div>
              <div>木</div>
              <div>金</div>
              <div className="text-red-500">土</div>
              <div className="text-red-500">日</div>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-md overflow-hidden">
              {days.map((day, dayIdx) => (
                <motion.button
                  key={day.date}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDateSelect(day.date)}
                  className={classNames(
                    "py-2 hover:bg-indigo-50 focus:z-10 transition-all duration-200",
                    day.isCurrentMonth ? "bg-white" : "bg-gray-50",
                    (day.isSelected || day.isToday) && "font-semibold",
                    day.isSelected && "text-white",
                    !day.isSelected &&
                      day.isCurrentMonth &&
                      !day.isToday &&
                      "text-gray-900",
                    !day.isSelected &&
                      !day.isCurrentMonth &&
                      !day.isToday &&
                      "text-gray-400",
                    day.isToday && !day.isSelected && "text-indigo-600",
                    dayIdx === 0 && "rounded-tl-lg",
                    dayIdx === 6 && "rounded-tr-lg",
                    dayIdx === days.length - 7 && "rounded-bl-lg",
                    dayIdx === days.length - 1 && "rounded-br-lg"
                  )}
                >
                  <time
                    dateTime={day.date}
                    className={classNames(
                      "mx-auto flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
                      day.isSelected &&
                        day.isToday &&
                        "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md",
                      day.isSelected &&
                        !day.isToday &&
                        "bg-gradient-to-br from-gray-800 to-gray-700 shadow-md",
                      day.isToday &&
                        !day.isSelected &&
                        "border-2 border-indigo-400"
                    )}
                  >
                    {day.date?.split("-").pop()?.replace(/^0/, "") ?? ""}
                  </time>
                </motion.button>
              ))}
            </div>

            {/* 予約状況サマリー - デザイン改善 */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2 border border-blue-100 p-2 rounded-lg shadow-sm">
                <Info className="h-4 w-4 text-indigo-600" />
                予約状況
              </h3>

              <ScrollArea className="h-auto pr-4">
                <div className="space-y-3">
                  {staffs.map((staff, idx) => {
                    const staffReservations = reservations.filter(
                      (r) => r.staffId === staff._id
                    );
                    const colorClass =
                      staffColorMap.get(staff._id) || colorPalette[0];
                    const baseColor = colorClass.split(" ")[0];

                    return (
                      <motion.div
                        key={staff._id}
                        className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.05 }}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${baseColor} border-2 shadow-sm mr-3`}
                        >
                          <span className="text-xs font-bold">
                            {staffReservations.length}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{staff.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-xs py-0 h-5 ${staffReservations.length > 0 ? "bg-indigo-50 text-indigo-800 border-indigo-200" : "bg-gray-50"}`}
                            >
                              {staffReservations.length > 0
                                ? `${staffReservations.length}件の予約`
                                : "予約なし"}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}