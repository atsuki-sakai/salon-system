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
  } = useZodForm(reservationSchema);

  const staffs = useQuery(api.staffs.getStaffsBySalonId, { salonId });
  const menus = useQuery(api.menus.getMenusBySalonId, { salonId });
  const createReservation = useMutation(api.reservations.create);

  if (!staffs || !menus) {
    return <Loading />;
  }

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
    } catch (error) {
      console.error(error);
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
          <Select onValueChange={(value) => setValue("menuId", value)}>
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
          <Input {...register("startTime")} type="time" step="300" />
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
