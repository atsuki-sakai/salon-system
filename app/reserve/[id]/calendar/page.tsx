"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OriginalBreadcrumb } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import type { TimeSlot } from "@/lib/types";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { useMutation } from "convex/react";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Doc } from "@/convex/_generated/dataModel";
import { getCookie } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReservationTimePicker() {
  const salonId = useParams().id as string;
  const router = useRouter();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  // ダイアログの表示状態を管理するstate
  const [dialogOpen, setDialogOpen] = useState(false);
  // カレンダーポップオーバーの開閉状態を管理
  const [calendarOpen, setCalendarOpen] = useState(false);

  // 日付文字列の生成（YYYY-MM-DD形式）
  const dateString = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;

  const optimalTimeSlots = useQuery(
    api.reservation.findOptimalTimeSlots,
    selectedMenuId && selectedStaffId && dateString
      ? {
          menuId: selectedMenuId as Id<"menu">,
          salonId,
          staffId: selectedStaffId as Id<"staff">,
          date: dateString,
        }
      : "skip"
  );

  console.log("optimalTimeSlots", optimalTimeSlots);

  // メニュー一覧とスタッフ一覧は既存のAPIから取得
  const menus = useQuery(api.menu.getMenusBySalonId, { salonId });
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });
  const selectedStaff = staffs?.find((staff) => staff._id === selectedStaffId);
  const selectedMenu = menus?.find((menu) => menu._id === selectedMenuId);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loginCustomer, setLoginCustomer] = useState<Doc<"customer"> | null>(
    null
  );
  const [disableDates, setDisableDates] = useState<Date[]>([]);
  const [availableStaffs, setAvailableStaffs] = useState<Doc<"staff">[]>([]);

  // 今後14日間の日付を配列で作成
  const nextTwoWeeks = [...Array(14)].map((_, i) => {
    const date = addDays(new Date(), i);
    return date;
  });

  useEffect(() => {
    if (selectedStaff) {
      const holidays =
        selectedStaff.regularHolidays?.map((dateStr) => new Date(dateStr)) ||
        [];
      setDisableDates(holidays);
    }
  }, [selectedStaff]);

  useEffect(() => {
    // 新しいメニューまたはスタッフが選択されたら選択済みの時間枠をリセット
    setSelectedTimeSlot(null);
    // ダイアログも閉じる
    setDialogOpen(false);
  }, [selectedMenuId, selectedStaffId, selectedDate]);

  useEffect(() => {
    const computedQuery = optimalTimeSlots || {
      success: false,
      availableSlots: [],
    };

    const newSlots =
      computedQuery && computedQuery.success
        ? computedQuery.availableSlots || []
        : [];

    if (JSON.stringify(newSlots) !== JSON.stringify(availableSlots)) {
      setAvailableSlots(newSlots);
    }
  }, [optimalTimeSlots, availableSlots]);

  // 日付選択時の処理
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // 日付選択後にカレンダーを閉じる
    setCalendarOpen(false);
  };

  // スロットを日付ごとにグループ化する関数
  const groupSlotsByDate = () => {
    const grouped: Record<string, TimeSlot[]> = {};

    availableSlots.forEach((slot) => {
      if (slot.date && typeof slot.date === "string") {
        grouped[slot.date] = grouped[slot.date] || [];
        grouped[slot.date]?.push(slot);
      }
    });

    return grouped;
  };

  // 日付フォーマット関数（例：3月7日（木））
  const formatDateJP = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "M月d日（E）", { locale: ja });
  };

  // 時間枠選択時の処理
  const handleTimeSlotSelection = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    // ダイアログを開く
    setDialogOpen(true);
  };

  // 予約確定処理（実際のAPIコールなどはここに追加）
  const createReservation = useMutation(api.reservation.add);
  const handleConfirmReservation = () => {
    try {
      if (!selectedDate || !selectedTimeSlot) {
        toast.error("日付または時間が選択されていません");
        return;
      }

      // 日付を正しく扱うために、format関数を使用して「YYYY-MM-DD」形式の文字列を生成
      // toISOString()は使わない！
      const dateString = format(selectedDate, "yyyy-MM-dd");

      // 選択された時間枠から時刻部分を抽出
      let startTimeStr = selectedTimeSlot.startTime;
      let endTimeStr = selectedTimeSlot.endTime;

      // 時間文字列がすでにISO形式（YYYY-MM-DDTHH:MM）の場合は、時間部分のみを抽出
      if (startTimeStr.includes("T")) {
        startTimeStr = startTimeStr.split("T")[1]!;
      }

      if (endTimeStr.includes("T")) {
        endTimeStr = endTimeStr.split("T")[1]!;
      }

      // 日付と時間を正しく結合してISO形式を作成
      const fullStartTime = `${dateString}T${startTimeStr}`;
      const fullEndTime = `${dateString}T${endTimeStr}`;

      createReservation({
        menuId: selectedMenuId,
        staffId: selectedStaffId,
        salonId: salonId,
        reservationDate: dateString,
        startTime: fullStartTime,
        endTime: fullEndTime,
        menuName: selectedMenu?.name ?? "",
        price: selectedMenu?.price ?? 0,
        customerId: loginCustomer?._id ?? "only-session",
        customerName: loginCustomer?.firstName ?? "未設定",
        customerPhone: loginCustomer?.phone ?? "未設定",
        status: "confirmed",
        notes: notes,
        staffName: selectedStaff?.name ?? "",
      });
      console.log("予約が確定されました", selectedDate);

      setDialogOpen(false);
      toast.success("予約が確定されました");
      router.push(`/reserve/${salonId}/calendar/complete`);
    } catch (error) {
      console.error("予約エラー:", error);
      toast.error("予約に失敗しました");
    }
  };

  // メニューとスタッフが選択されているかどうかを確認
  const isStepOneComplete = !!selectedMenuId;
  const isStepTwoComplete = !!selectedStaffId;
  // 合計金額の計算
  const calculateTotalPrice = () => {
    if (!selectedMenu) return 0;
    const menuPrice = selectedMenu?.salePrice
      ? selectedMenu?.salePrice
      : selectedMenu?.price;
    const extraCharge = selectedStaff?.extraCharge || 0;
    return menuPrice + extraCharge;
  };

  // 選択されたメニュー名
  const selectedMenuName = menus?.find(
    (menu) => menu._id === selectedMenuId
  )?.name;

  // 選択されたメニューの所要時間
  const selectedMenuDuration = menus?.find(
    (menu) => menu._id === selectedMenuId
  )?.timeToMin;

  useEffect(() => {
    const customerData = getCookie("salonapp-customer-cookie");
    console.log("customerData", customerData);
    if (!salonId) return;
    if (customerData) {
      console.log(customerData);
      setLoginCustomer(JSON.parse(customerData));
    } else {
      router.push(`/reserve/${salonId}`);
    }
  }, [router, salonId]);

  useEffect(() => {
    if (selectedMenu && staffs) {
      const filteredStaffs = staffs.filter((staff) =>
        selectedMenu.availableStaffIds.includes(staff._id)
      );
      setAvailableStaffs(filteredStaffs);
    } else {
      setAvailableStaffs([]);
    }
  }, [selectedMenu, staffs]);

  console.log("loginCustomer", loginCustomer);
  console.log("selectedDate", selectedDate);

  const breadcrumbItems = [
    { label: "予約者情報の設定", href: `/reserve/${salonId}` },
    { label: "予約時間を選択", href: `/reserve/${salonId}/calendar` },
  ];
  return (
    <div className="w-full max-w-3xl mx-auto ">
      <Card className="">
        <CardHeader className="b">
          <div className="mb-3">
            <OriginalBreadcrumb items={breadcrumbItems} />
          </div>
          <CardTitle className="text-xl font-bold text-start tracking-wide text-slate-800">
            予約時間を選択
          </CardTitle>
        </CardHeader>

        <CardContent className="">
          <div className="space-y-6">
            {/* メニュー選択セクション */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-700 px-2 py-1"
                >
                  STEP 1
                </Badge>
                <span className="text-sm tracking-wide">メニューを選択</span>
              </div>
              <Select onValueChange={(value) => setSelectedMenuId(value)}>
                <SelectTrigger className="w-full border-2 border-indigo-100 ring-offset-indigo-100">
                  <SelectValue placeholder="メニューを選択" />
                </SelectTrigger>
                <SelectContent>
                  {menus && menus?.length > 0 ? (
                    menus.map((menu) => (
                      <SelectItem key={menu._id} value={menu._id}>
                        {menu.name} ({menu.timeToMin}分)
                      </SelectItem>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-1">
                      メニューが見つかりません
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* スタッフ選択セクション - 必須に変更 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-700 px-2 py-1"
                >
                  STEP 2
                </Badge>
                <span className="text-sm tracking-wide">スタッフを指名</span>
              </div>

              {!isStepOneComplete && (
                <span className=" text-red-700 text-xs">
                  先にメニューを選択してください
                </span>
              )}

              <Select
                onValueChange={(value) => setSelectedStaffId(value)}
                disabled={!isStepOneComplete}
              >
                <SelectTrigger className="w-full border-2 border-indigo-100 ring-offset-indigo-100">
                  <SelectValue placeholder="スタッフを指名" />
                </SelectTrigger>
                <SelectContent>
                  {/* 「未指定」オプションを削除 */}
                  {availableStaffs.length > 0 ? (
                    availableStaffs?.map((staff) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        {staff.name} -{" "}
                        {staff.extraCharge
                          ? "指名料 / ¥" + staff.extraCharge.toLocaleString()
                          : "指名料無料"}
                      </SelectItem>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-1">
                      対応可能なスタッフが見つかりません。
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 日付選択セクション */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-700 px-2 py-1"
                >
                  STEP 3
                </Badge>
                <span className="text-sm tracking-wide">日付を選択</span>
              </div>

              {(!isStepTwoComplete || !isStepOneComplete) && (
                <span className=" text-red-700 text-xs">
                  先にメニューとスタッフを選択してください
                </span>
              )}

              <div className="flex flex-col space-y-4">
                {/* カレンダーポップオーバー - open状態を制御 */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm tracking-wider border-2 border-indigo-100",
                        !selectedDate && "text-gray-500",
                        !isStepTwoComplete && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isStepTwoComplete}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                      {selectedDate
                        ? format(selectedDate, "yyyy年MM月dd日（E）", {
                            locale: ja,
                          })
                        : "日付を選択してください"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const isPast = date < today;
                        const isHoliday = disableDates.some(
                          (disabledDate) =>
                            disabledDate.toDateString() === date.toDateString()
                        );
                        return isPast || isHoliday;
                      }}
                      locale={ja}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {nextTwoWeeks
                    .filter(
                      (date) =>
                        !disableDates.some(
                          (disabledDate) =>
                            disabledDate.toDateString() === date.toDateString()
                        )
                    )
                    .slice(0, 6)
                    .map((date, index) => (
                      <Button
                        key={index}
                        variant={"outline"}
                        size="sm"
                        onClick={() => setSelectedDate(date)}
                        disabled={!isStepTwoComplete}
                        className={`relative text-sm h-10 ${
                          selectedDate &&
                          format(selectedDate, "yyyy-MM-dd") ===
                            format(date, "yyyy-MM-dd")
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : "bg-white text-gray-800 border-gray-200"
                        } ${!isStepTwoComplete && "opacity-50 cursor-not-allowed"}`}
                      >
                        {format(date, "MM/dd（E）", { locale: ja })}
                      </Button>
                    ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* 予約可能な時間枠セクション */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-700 px-2 py-1"
                >
                  STEP 4
                </Badge>
                <span className="text-sm tracking-wide">時間を選択</span>
              </div>

              {isStepOneComplete && isStepTwoComplete ? (
                availableSlots.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupSlotsByDate()).map(([date, slots]) => (
                      <div key={date} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-indigo-600" />
                          <h3 className="font-bold text-lg text-gray-700">
                            {formatDateJP(date)}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {slots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={"outline"}
                              onClick={() => handleTimeSlotSelection(slot)}
                              className={`h-auto py-2 flex flex-col items-start justify-center text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors ${
                                selectedTimeSlot?.date === slot.date &&
                                selectedTimeSlot?.startTime === slot.startTime
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : "bg-white text-gray-800 border-gray-200"
                              }`}
                            >
                              <p className="text-xs tracking-wide">
                                {format(new Date(slot.date!), "M月dd日", {
                                  locale: ja,
                                })}
                                {" - "}
                                {slot.staffName}
                              </p>
                              <span className="font-bold text-sm">
                                {slot.startTime.split("T")[1]}〜
                                {slot.endTime.split("T")[1]}
                              </span>
                              <span className="text-sm mt-1">
                                {selectedMenuName}
                              </span>
                              <div className="w-full flex items-end justify-end gap-2">
                                <span className="inline-block text-xs">
                                  {selectedMenuDuration}分
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="relative text-xs mt-1 text-green-700 font-bold ">
                                  <span className="absolute -top-2.5 -left-2 inline-block text-xs scale-50">
                                    基本料{" "}
                                  </span>
                                  <span className="text-xs mt-1 text-green-700 font-bold">
                                    {selectedMenu?.salePrice ? (
                                      <div className="flex flex-col items-end">
                                        <span className="inline-block line-through text-gray-500 text-xs scale-50 -mr-2">
                                          ¥
                                          {selectedMenu?.price.toLocaleString()}
                                        </span>
                                        <span className="inline-block -mt-1">
                                          ¥
                                          {selectedMenu?.salePrice.toLocaleString()}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>
                                        ¥{selectedMenu?.price.toLocaleString()}
                                      </span>
                                    )}
                                  </span>
                                </p>

                                {staffs?.find(
                                  (staff) => staff._id === selectedStaffId
                                )?.extraCharge ? (
                                  <p className="relative text-xs mt-1 text-green-700 font-bold">
                                    {" + "}
                                    <span className="absolute -top-2.5 left-0 inline-block text-xs scale-50">
                                      指名料{" "}
                                    </span>
                                    <span>
                                      ¥
                                      {selectedStaff?.extraCharge?.toLocaleString()}
                                    </span>
                                  </p>
                                ) : null}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
                    <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-bold">
                      {isStepOneComplete && isStepTwoComplete
                        ? "利用可能な時間枠が見つかりません"
                        : "予約日を選択してください"}
                    </p>
                    <p className="text-xs mt-1">
                      スタッフや日付を変更して再度ご確認ください.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-lg shadow-md bg-gray-50 p-4 text-center text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-bold">
                    必要情報を入力してください
                  </p>
                  <p className="text-xs mt-1">
                    メニュー、スタッフ、日付をすべて選択すると利用可能な時間枠が表示されます
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* アラートダイアログ（選択した予約情報の確認） */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className="max-h-screen max-w-md overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">
                予約内容の確認
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                以下の内容で予約を確定しますか？
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className=" space-y-4">
              {/* メニュー情報 */}
              <div className="bg-slate-50 p-3 rounded-md">
                <h4 className="font-medium text-slate-800 mb-2 text-sm">
                  予約メニュー
                </h4>
                <div className="flex w-full mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className=" text-green-800 tracking-wide font-semibold">
                      {selectedTimeSlot
                        ? formatDateJP(selectedTimeSlot.date!)
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs">開始時間</span>
                    <span className=" text-slate-800 tracking-wide font-semibold">
                      {selectedTimeSlot
                        ? `${selectedTimeSlot.startTime.split("T")[1]}〜${selectedTimeSlot.endTime.split("T")[1]}`
                        : ""}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 tracking-wide">
                  開始時間の5分前にはお店にお越し頂けますと幸いです。
                </p>
                <div className="flex justify-between items-center my-3 pt-3">
                  <span className="text-base font-semibold">
                    {selectedMenuName}
                  </span>
                  <span className="font-bold">{selectedMenuDuration}分</span>
                </div>
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">担当スタッフ</span>
                    <span className="font-medium tracking-wide">
                      {selectedTimeSlot?.staffName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 料金情報 */}
              <div className="bg-white border border-gray-200 p-3 rounded-md">
                <h4 className="font-medium text-slate-800 mb-2">料金</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">メニュー料金 </span>
                    {selectedMenu?.salePrice ? (
                      <div className="flex flex-col items-end">
                        <span className="inline-block line-through text-gray-500 text-xs">
                          ¥{selectedMenu?.price.toLocaleString()}
                        </span>
                        <span className="inline-block -mt-1">
                          ¥{selectedMenu?.salePrice.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span>¥{selectedMenu?.price.toLocaleString()}</span>
                    )}
                  </div>
                  {selectedStaff?.extraCharge ? (
                    <div className="flex justify-between">
                      <span className="text-sm">指名料 </span>
                      <span className="font-bold">
                        ¥ {selectedStaff?.extraCharge?.toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-bold">合計：</span>
                    <span className="font-bold text-green-700 text-lg">
                      ¥ {calculateTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="notes"
                  className="font-medium text-slate-800 text-sm"
                >
                  備考
                </label>
                <Textarea
                  id="notes"
                  className="text-sm tracking-wide"
                  placeholder="備考"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="mt-0">閉じる</AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-700 hover:bg-green-800 text-white"
                onClick={handleConfirmReservation}
              >
                この内容で予約を確定する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}