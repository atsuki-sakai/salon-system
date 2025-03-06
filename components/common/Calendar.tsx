"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
} from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "../ui/button";
import { useParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Doc } from "@/convex/_generated/dataModel";
// クラス名を結合するユーティリティ
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes
    .filter((cls): cls is string => typeof cls === "string")
    .join(" ");
}

// カレンダー用の日付データを生成する関数
function getCalendarDays(date: Date, selectedDate: Date) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isToday(day),
    isSelected:
      format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
  }));
}

// スタッフのIDからハッシュ値を算出し、動的に色を生成する関数
function getStaffColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360; // ハッシュ値から 0〜359 の色相を算出
  return `hsl(${hue}, 80%, 90%)`; // 飽和度70%、明度85%で柔らかい色合いに
}

export default function Calendar() {
  const params = useParams();
  const salonId = params.id as string;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [filteredReservations, setFilteredReservations] = useState<
    Doc<"reservations">[]
  >([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Doc<"reservations"> | null>(null);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(parseISO(date));
  };

  const days = getCalendarDays(currentMonth, selectedDate);

  // 必要なデータの取得
  const staffs = useQuery(api.staffs.getStaffsBySalonId, { salonId });
  const menus = useQuery(api.menus.getMenusBySalonId, { salonId });
  const reservations = useQuery(api.reservations.getReservationsByDate, {
    salonId,
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  const handlePrevDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleShowReservation = (reservationId: string) => {
    const reservation = reservations?.find(
      (reservation) => reservation._id === reservationId
    );
    if (reservation) {
      setSelectedReservation(reservation);
    } else {
      setSelectedReservation(null);
      console.log("reservation not found");
    }
  };

  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !container.current ||
      !containerNav.current ||
      !containerOffset.current
    ) {
      return;
    }
    const currentMinute = new Date().getHours() * 60;
    container.current.scrollTop =
      ((container.current.scrollHeight -
        containerNav.current.offsetHeight -
        containerOffset.current.offsetHeight) *
        currentMinute) /
      1440;
  }, []);

  useEffect(() => {
    console.log("filteredReservations", filteredReservations);
  }, [filteredReservations]);

  console.log("menus", menus);
  console.log("staffs", staffs);
  console.log("reservations", reservations);
  console.log("selectedStaffId", selectedStaffId);
  console.log("filteredReservations", filteredReservations);

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

  // allモード時のためのスタッフごとのカラムマッピングを作成
  const staffColumnMap = new Map<string, number>();
  if (staffs) {
    staffs.forEach((staff, index) => {
      staffColumnMap.set(staff._id, index + 1);
    });
  }
  const numCols = selectedStaffId === "all" ? (staffs?.length ?? 1) : 1;
  const gridTemplateColumns = `repeat(${numCols}, minmax(0, 1fr))`;
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            <time dateTime={format(selectedDate, "yyyy-MM-dd")}>
              {format(selectedDate, "yyyy年M月d日", { locale: ja })}
            </time>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(selectedDate, "EEEE", { locale: ja })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-gray-500">スタッフで絞り込み</p>
          <Select
            value={selectedStaffId}
            onValueChange={(value) => setSelectedStaffId(value as string)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue defaultValue={"all"} placeholder="全て" />
            </SelectTrigger>
            <SelectContent>
              {staffs?.map((staff, index) => (
                <div key={staff._id}>
                  {index === 0 ? (
                    <SelectItem key={index} value={"all"}>
                      全て
                    </SelectItem>
                  ) : null}
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name}
                  </SelectItem>
                </div>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center">
            <div className="relative flex items-center rounded-md bg-white shadow-xs md:items-stretch">
              <button
                type="button"
                onClick={handlePrevDay}
                className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">前の日</span>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
              >
                今日
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
              >
                <span className="sr-only">次の日</span>
                <ChevronRightIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="hidden md:ml-4 md:flex md:items-center">
              <div className="ml-6 h-6 w-px bg-gray-300" />
              <Link href={`/dashboard/${salonId}/calendar/create`}>
                <Button className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  イベントを追加
                </Button>
              </Link>
            </div>
            <Menu as="div" className="relative ml-6 md:hidden">
              <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500">
                <span className="sr-only">メニューを開く</span>
                <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-hidden data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                    >
                      イベントを作成
                    </a>
                  </MenuItem>
                </div>
                <div className="py-1">
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                    >
                      今日に移動
                    </a>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </header>
      <div className="w-full md:hidden max-w-md flex-none border-l border-gray-100 px-8 py-10">
        <div className="flex items-center text-center text-gray-900">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">前の月</span>
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
          </button>
          <div className="flex-auto text-sm font-semibold">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">次の月</span>
            <ChevronRightIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-7 text-center text-xs/6 text-gray-500">
          <div>月</div>
          <div>火</div>
          <div>水</div>
          <div>木</div>
          <div>金</div>
          <div>土</div>
          <div>日</div>
        </div>
        <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm ring-1 shadow-sm ring-gray-200">
          {days.map((day, dayIdx) => (
            <button
              key={day.date}
              type="button"
              onClick={() => handleDateSelect(day.date)}
              className={classNames(
                "py-1.5 hover:bg-gray-100 focus:z-10",
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
                  "mx-auto flex size-7 items-center justify-center rounded-full",
                  day.isSelected && day.isToday ? "bg-indigo-600" : "",
                  day.isSelected && !day.isToday ? "bg-gray-900" : ""
                )}
              >
                {day.date?.split("-").pop()?.replace(/^0/, "") ?? ""}
              </time>
            </button>
          ))}
        </div>
      </div>
      <div className="isolate flex flex-auto overflow-hidden bg-white">
        <div ref={container} className="flex flex-auto flex-col overflow-auto">
          <div className="flex w-full flex-auto">
            <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* 横線 */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                style={{ gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))" }}
              >
                <div ref={containerOffset} className="row-end-1 h-7"></div>
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    0時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    1時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    2時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    3時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    4時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    5時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    6時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    7時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    8時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    9時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    10時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    11時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    12時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    13時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    14時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    15時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    16時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    17時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    18時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    19時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    20時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    21時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    22時
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    23時
                  </div>
                </div>
                <div />
              </div>
              {/* イベント */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid"
                style={{
                  gridTemplateRows: "1.75rem repeat(288, minmax(0, 1fr)) auto",
                  gridTemplateColumns: gridTemplateColumns,
                }}
              >
                {filteredReservations?.map((reservation) => {
                  const startMinutes = getMinutesFromTime(
                    reservation.startTime
                  );
                  const endMinutes = getMinutesFromTime(reservation.endTime);
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
                  // スタッフIDから動的に背景色を生成
                  const bgColor = getStaffColorFromId(reservation.staffId);

                  return (
                    <li
                      key={reservation._id}
                      className="relative mt-px flex"
                      style={reservationStyle}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              handleShowReservation(reservation._id)
                            }
                            style={{ backgroundColor: bgColor }}
                            className="group absolute inset-1 flex flex-col overflow-y-auto justify-start items-start rounded-sm border border-gray-200 p-2 text-xs/5 hover:bg-blue-100 shadow-sm"
                          >
                            <p className="text-slate-700">
                              {reservation.menuName}
                            </p>
                            <span className="text-slate-700 text-xs">
                              {reservation.staffName}
                            </span>
                            <p className="text-indigo-700  text-sm my-2">
                              {format(parseISO(reservation.startTime), "HH:mm")}{" "}
                              ~{format(parseISO(reservation.endTime), "HH:mm")}
                            </p>
                            <p className=" text-slate-700">
                              {reservation.customerName}
                            </p>
                            <p className="text-slate-700 text-sm tracking-wide">
                              {reservation.customerPhone}
                            </p>
                            <div className="text-slate-700 text-xs mt-2">
                              <p>備考</p>
                              <p>
                                {reservation.note ? reservation.note : "なし"}
                              </p>
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent style={{ backgroundColor: bgColor }}>
                          {selectedReservation && (
                            <div className="">
                              <span className="text-sm">メニュー</span>
                              <h5 className="text-lg font-bold mb-2">
                                {selectedReservation.menuName}
                              </h5>
                              <p className="text-sm">
                                対応スタッフ -{" "}
                                <span className="font-bold">
                                  {selectedReservation.staffName}
                                </span>
                              </p>
                              <p className="text-xs mt-4">施術時間</p>
                              <p className="text-sm text-indigo-700">
                                {selectedReservation.startTime.split("T")[1]} ~{" "}
                                {selectedReservation.endTime.split("T")[1]}
                              </p>
                              <p className="text-xs mt-4">お客様名</p>
                              <p className="text-base">
                                {selectedReservation.customerName}
                              </p>
                              <p className="text-xs">
                                TEL:{" "}
                                <span className="font-bold text-sm underline tracking-wide">
                                  {selectedReservation.customerPhone}
                                </span>
                              </p>
                              <p className="text-xs mt-4">備考</p>
                              <p className="text-sm">
                                {selectedReservation.note
                                  ? selectedReservation.note
                                  : "なし"}
                              </p>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
        <div className="hidden w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 md:block">
          <div className="flex items-center text-center text-gray-900">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">前の月</span>
              <ChevronLeftIcon className="size-5" aria-hidden="true" />
            </button>
            <div className="flex-auto text-sm font-semibold">
              {format(currentMonth, "yyyy年M月", { locale: ja })}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">次の月</span>
              <ChevronRightIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-7 text-center text-xs/6 text-gray-500">
            <div>月</div>
            <div>火</div>
            <div>水</div>
            <div>木</div>
            <div>金</div>
            <div>土</div>
            <div>日</div>
          </div>
          <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm ring-1 shadow-sm ring-gray-200">
            {days.map((day, dayIdx) => (
              <button
                key={day.date}
                type="button"
                onClick={() => handleDateSelect(day.date)}
                className={classNames(
                  "py-1.5 hover:bg-gray-100 focus:z-10",
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
                    "mx-auto flex size-7 items-center justify-center rounded-full",
                    day.isSelected && day.isToday ? "bg-indigo-600" : "",
                    day.isSelected && !day.isToday ? "bg-gray-900" : ""
                  )}
                >
                  {day.date?.split("-").pop()?.replace(/^0/, "") ?? ""}
                </time>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMinutesFromTime(timeString: string) {
  const date = parseISO(timeString);
  return date.getHours() * 60 + date.getMinutes();
}