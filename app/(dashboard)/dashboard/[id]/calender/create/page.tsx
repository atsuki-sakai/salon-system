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
import { useState } from "react";

const reservationSchema = z.object({
  customerName: z.string().min(1, "お客様名を入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください"),
  staffId: z.string().min(1, "スタッフを選択してください"),
  menuId: z.string().min(1, "メニューを選択してください"),
  reservationDate: z.string().min(1, "予約日を選択してください"),
  startTime: z.string().min(1, "開始時間を選択してください"),
  note: z.string().optional(),
});

export default function CreateReservation() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useZodForm(reservationSchema);

  const staffs = useQuery(api.staffs.getStaffsBySalonId, { salonId });
  const menus = useQuery(api.menus.getMenusBySalonId, { salonId });
  const createReservation = useMutation(api.reservations.create);

  const [selectedMenu, setSelectedMenu] = useState<{
    timeToMin: number;
  } | null>(null);
  const [endTime, setEndTime] = useState<string>("");

  if (!staffs || !menus) {
    return <Loading />;
  }

  const handleMenuSelect = (menuId: string) => {
    setValue("menuId", menuId);
    const menu = menus?.find((m) => m._id === menuId);
    setSelectedMenu(menu || null);
    // 現在の開始時間をwatchから取得して終了時間を計算
    const currentStartTime = watch("startTime");
    calculateEndTime(menu, currentStartTime);
  };

  const handleStartTimeSelect = (time: string) => {
    setValue("startTime", time);
    calculateEndTime(selectedMenu, time);
  };

  const calculateEndTime = (
    menu: { timeToMin: number } | null,
    startTime?: string
  ) => {
    if (!menu || !startTime) {
      setEndTime("");
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + menu.timeToMin;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    setEndTime(
      `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
    );
  };

  const onSubmit = async (data: z.infer<typeof reservationSchema>) => {
    try {
      const selectedStaff = staffs?.find((staff) => staff._id === data.staffId);
      const selectedMenu = menus?.find((menu) => menu._id === data.menuId);

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
        staffName: selectedStaff.name,
        menuId: selectedMenu._id,
        menuName: selectedMenu.name,
        price: selectedMenu.price,
        salonId,
        salonName: "Salon Name",
        reservationDate: data.reservationDate,
        status: "confirmed",
        startTime: startDateTime,
        endTime: endDateTime,
        note: data.note || "",
      });

      toast.success("予約を作成しました");
      router.push(`/dashboard/${salonId}/calender`);
    } catch (error: any) {
      console.error("Error details:", error);

      if (error.message && error.message.includes("{")) {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${salonId}/calender`}>
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
          <Label htmlFor="staffId">担当スタッフ</Label>
          <Select onValueChange={(value) => setValue("staffId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="スタッフを選択" />
            </SelectTrigger>
            <SelectContent>
              {staffs.map((staff) => (
                <SelectItem key={staff._id} value={staff._id}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.staffId && (
            <p className="text-sm text-red-500 mt-1">
              {errors.staffId.message}
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
              {menus.map((menu) => (
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
              {Array.from({ length: 24 * 6 }, (_, i) => {
                const hour = Math.floor(i / 6);
                const minute = (i % 6) * 10;
                const time = `${hour.toString().padStart(2, "0")}:${minute
                  .toString()
                  .padStart(2, "0")}`;
                return (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                );
              })}
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

function getMinutesFromTime(timeString: string) {
  const date = new Date(timeString);
  return date.getHours() * 60 + date.getMinutes();
}