"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loading } from "@/components/common";
import type { Doc } from "@/convex/_generated/dataModel";
import { useSalonCore } from "@/hooks/useSalonCore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useZodForm } from "@/hooks/useZodForm";
import { format } from "date-fns";
import { useState, useEffect } from "react";

// 予約情報のスキーマ
const reservationSchema = z.object({
  customerName: z.string().min(1, "お客様名を入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください"),
  staffId: z.string().min(1, "スタッフを選択してください"),
  menuId: z.string().min(1, "メニューを選択してください"),
  reservationDate: z.string().min(1, "予約日を選択してください"),
  startTime: z.string().min(1, "開始時間を選択してください"),
  note: z.string().optional(),
});

// ユーティリティ関数：時刻文字列 "HH:mm" を分数に変換
function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

// 分数から "HH:mm" 形式の文字列に変換
function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// 予約済み時間帯と営業時間から、施術時間（duration分）分の余裕がある開始時刻候補を10分刻みで算出
function computeAvailableTimeSlots(
  open: number,
  close: number,
  reservations: { start: number; end: number }[],
  duration: number
): number[] {
  const slots: number[] = [];
  // 予約が無い場合：営業時間全体を10分刻みで候補にする
  if (!reservations || reservations.length === 0) {
    for (let t = open; t + duration <= close; t += 10) {
      slots.push(t);
    }
    return slots;
  }
  // 営業開始から最初の予約まで
  if (reservations?.[0]?.start && reservations[0].start - open >= duration) {
    for (let t = open; t + duration <= reservations[0].start; t += 10) {
      slots.push(t);
    }
  }
  // 予約間の隙間
  for (let i = 0; i < reservations.length - 1; i++) {
    const gapStart = reservations[i]?.end;
    const gapEnd = reservations[i + 1]?.start;
    if (gapEnd && gapStart && gapEnd - gapStart >= duration) {
      for (let t = gapStart; t + duration <= gapEnd; t += 10) {
        slots.push(t);
      }
    }
  }
  // 最後の予約終了から営業時間終了まで
  const lastReservation = reservations[reservations.length - 1];
  if (
    reservations &&
    reservations.length > 0 &&
    lastReservation?.end &&
    close - lastReservation.end >= duration
  ) {
    for (
      let t = reservations[reservations.length - 1]?.end ?? 0;
      t + duration <= close;
      t += 10
    ) {
      slots.push(t);
    }
  }
  return slots;
}

export default function CreateReservation() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;
  const { isSubscribed } = useSalonCore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useZodForm(reservationSchema);

  // 全スタッフと全メニューの取得
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });
  const menus = useQuery(api.menu.getMenusBySalonId, { salonId });
  const createReservation = useMutation(api.reservation.add);

  // 選択したメニュー情報、フィルタリングされたスタッフ一覧、終了時刻、及び空き開始時刻候補の状態管理
  const [selectedMenu, setSelectedMenu] = useState<Doc<"menu"> | null>(null);
  const [filteredStaffs, setFilteredStaffs] = useState<Doc<"staff">[]>([]);
  const [endTime, setEndTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // フォームのwatch値
  const watchedStartTime = watch("startTime");
  const watchedReservationDate = watch("reservationDate");
  const watchedStaffId = watch("staffId");

  // 予約済み情報の取得（予約日が入力されている場合のみ）
  const reservationsForDate = useQuery(
    api.reservation.getReservationsByDate,
    watchedReservationDate ? { salonId, date: watchedReservationDate } : "skip"
  );

  // useEffectをここに移動（early returnの前）
  useEffect(() => {
    if (
      watchedReservationDate &&
      watchedStaffId &&
      selectedMenu &&
      reservationsForDate
    ) {
      // 営業時間を09:00〜18:00と仮定
      const open = timeStringToMinutes("09:00");
      const close = timeStringToMinutes("20:00");

      // 選択されたスタッフの予約のみ抽出（予約時間はISO文字列の「T」以降を利用）
      const staffReservations = reservationsForDate
        .filter((res: Doc<"reservation">) => res.staffId === watchedStaffId)
        .map((res: Doc<"reservation">) => {
          const startPart = res.startTime.split("T")[1] ?? "00:00";
          const endPart = res.endTime.split("T")[1] ?? "00:00";
          return {
            start: timeStringToMinutes(startPart),
            end: timeStringToMinutes(endPart),
          };
        })
        .sort((a, b) => a.start - b.start);

      // 空き時間候補を計算（10分刻みで算出）
      const slotsInMinutes = computeAvailableTimeSlots(
        open,
        close,
        staffReservations,
        selectedMenu.timeToMin
      );
      const slots = slotsInMinutes.map(minutesToTimeString);
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [
    watchedReservationDate,
    watchedStaffId,
    selectedMenu,
    reservationsForDate,
  ]);

  if (!staffs || !menus) {
    return <Loading />;
  }

  // メニュー選択時の処理：選択されたメニューに基づいて、対応可能なスタッフ（menu.staffIdsに含まれるもの）のみを抽出
  const handleMenuSelect = (menuId: string) => {
    setValue("menuId", menuId);
    const menu = menus.find((m: Doc<"menu">) => m._id === menuId);
    setSelectedMenu(menu || null);
    if (menu) {
      console.log("menu", menu);
      const availableStaffs = staffs.filter((staff: Doc<"staff">) =>
        menu.availableStaffIds.includes(staff._id)
      );
      console.log("availableStaffs", availableStaffs);
      setFilteredStaffs(availableStaffs);
    } else {
      setFilteredStaffs([]);
    }
    // すでに開始時間が選択されている場合、終了時刻を再計算
    const currentStartTime = watchedStartTime;
    calculateEndTime(
      menu ? { timeToMin: menu.timeToMin } : null,
      currentStartTime
    );
  };

  // 開始時間選択時の処理：終了時刻を計算
  const handleStartTimeSelect = (time: string) => {
    setValue("startTime", time);
    calculateEndTime(selectedMenu, time);
  };

  // 開始時刻から終了時刻を計算する関数（メニューの施術時間を加算）
  const calculateEndTime = (
    menu: { timeToMin: number } | null,
    startTime?: string
  ) => {
    if (!menu || !startTime) {
      setEndTime("");
      return;
    }
    const [hours, minutes] = startTime.split(":").map(Number) as [
      number,
      number,
    ];
    const totalMinutes = hours * 60 + minutes + menu.timeToMin;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    setEndTime(
      `${endHours.toString().padStart(2, "0")}:${endMinutes
        .toString()
        .padStart(2, "0")}`
    );
  };

  // 予約作成処理
  const onSubmit = async (data: z.infer<typeof reservationSchema>) => {
    try {
      const selectedStaff = staffs.find(
        (staff: Doc<"staff">) => staff._id === data.staffId
      );
      const selectedMenu = menus.find(
        (menu: Doc<"menu">) => menu._id === data.menuId
      );

      if (!selectedStaff || !selectedMenu) {
        toast.error("スタッフまたはメニューの選択が無効です");
        return;
      }

      const startDateTime = `${data.reservationDate}T${data.startTime}`;
      const endDateTime = format(
        new Date(
          new Date(startDateTime).getTime() + selectedMenu.timeToMin * 60000
        ),
        "yyyy-MM-dd'T'HH:mm"
      );

      await createReservation({
        customerId: "temporary-id",
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        staffId: selectedStaff._id,
        staffName: selectedStaff.name || "",
        menuId: selectedMenu._id,
        menuName: selectedMenu.name,
        price: selectedMenu.price,
        salonId,
        reservationDate: data.reservationDate,
        status: "confirmed",
        startTime: startDateTime,
        endTime: endDateTime,
        notes: data.note || "",
        selectedOptions: [],
      });

      toast.success("予約を作成しました");
      router.push(`/dashboard/${salonId}/reservation`);
    } catch (error: unknown) {
      console.error("Error details:", error);

      if (error instanceof Error && error.message.includes("{")) {
        try {
          const jsonStr = error.message.substring(
            error.message.indexOf("{"),
            error.message.lastIndexOf("}") + 1
          );
          const errorData = JSON.parse(jsonStr);

          if (errorData.type === "RESERVATION_CONFLICT") {
            const { customerName, startTime, endTime, staffName, menuName } =
              errorData.conflictingReservation;
            const formattedDate = format(new Date(startTime), "M月d日");
            const formattedStart = format(new Date(startTime), "HH:mm");
            const formattedEnd = format(new Date(endTime), "HH:mm");

            toast.error(
              <div className="flex flex-col gap-1">
                <p>予約が重複しています</p>
                <p className="text-sm text-gray-100">
                  {formattedDate} {formattedStart}～{formattedEnd}
                </p>
                <p className="text-sm text-gray-100">
                  予約者: {customerName}様
                </p>
                <p className="text-sm text-gray-100">
                  担当スタッフ: {staffName}
                </p>
                <p className="text-sm text-gray-100">メニュー: {menuName}</p>
              </div>,
              {
                duration: 20000,
              }
            );
            return;
          }
        } catch (parseError) {
          console.error("Error parsing error message:", parseError);
        }
      }

      toast.error("予約の作成に失敗しました");
    }
  };

  if (!isSubscribed) {
    return (
      <div className="text-center text-sm text-gray-500 min-h-[500px] flex items-center justify-center">
        サブスクリプション契約が必要です。
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${salonId}/calendar`}>
          <span className="text-sm text-indigo-700 flex items-center justify-start gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>カレンダーに戻る</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">新規予約作成</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="customerName">お客様名</Label>
          <Input {...register("customerName")} />
          {errors.customerName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="customerPhone">電話番号</Label>
          <Input {...register("customerPhone")} type="tel" />
          {errors.customerPhone && (
            <p className="text-sm text-red-500 mt-1">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="menuId">メニュー</Label>
          <Select onValueChange={handleMenuSelect}>
            <SelectTrigger>
              <SelectValue placeholder="メニューを選択" />
            </SelectTrigger>
            <SelectContent>
              {menus.map((menu: Doc<"menu">) => (
                <SelectItem key={menu._id} value={menu._id}>
                  {menu.name} ({menu.timeToMin}分)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.menuId && (
            <p className="text-sm text-red-500 mt-1">{errors.menuId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="staffId">担当スタッフ</Label>
          <Select onValueChange={(value) => setValue("staffId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="スタッフを選択" />
            </SelectTrigger>
            <SelectContent>
              {filteredStaffs.length > 0 ? (
                filteredStaffs.map((staff: Doc<"staff">) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-staff" disabled>
                  対応可能なスタッフなし
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.staffId && (
            <p className="text-sm text-red-500 mt-1">
              {errors.staffId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="reservationDate">予約日</Label>
          <Input {...register("reservationDate")} type="date" />
          {errors.reservationDate && (
            <p className="text-sm text-red-500 mt-1">
              {errors.reservationDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="startTime">開始時間</Label>
          <Select onValueChange={handleStartTimeSelect}>
            <SelectTrigger>
              <SelectValue placeholder="開始時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-slots" disabled>
                  空き時間なし
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            {endTime && `終了時間: ${endTime}`}
          </p>
          {errors.startTime && (
            <p className="text-sm text-red-500 mt-1">
              {errors.startTime.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="note">備考</Label>
          <Input {...register("note")} />
          {errors.note && (
            <p className="text-sm text-red-500 mt-1">{errors.note.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "予約を作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
