// /app/(dashboard)/dashboard/[id]/reservation/edit/[reservation_id]/EditReservationForm.tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useZodForm } from "@/hooks/useZodForm";
import { Doc } from "@/convex/_generated/dataModel";
import { reservationSchema } from "@/lib/validations";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EditReservationFormProps {
  reservation: Doc<"reservation">;
}

export default function EditReservationForm({
  reservation,
}: EditReservationFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useZodForm(reservationSchema);

  const updateReservation = useMutation(api.reservation.update);
  const onSubmit = async (data: z.infer<typeof reservationSchema>) => {
    try {
      await updateReservation({
        reservationId: reservation._id,
        ...data,
      });
      toast.success("予約を更新しました");
      router.push(`/dashboard/${reservation.salonId}/reservation`);
    } catch (error) {
      console.error(error);
      toast.error("予約の更新に失敗しました");
    }
  };

  const deleteReservation = useMutation(api.reservation.trash);
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const confirmed = confirm("本当に削除しますか？");
      if (!confirmed) {
        return;
      }
      await deleteReservation({
        reservationId: reservation._id,
      });
      toast.success("予約を削除しました");
      router.push(`/dashboard/${reservation.salonId}/reservation`);
    } catch (error) {
      console.error(error);
      toast.error("予約の削除に失敗しました");
    }
  };

  useEffect(() => {
    setValue("customerName", reservation.customerName);
    setValue("customerPhone", reservation.customerPhone);
    setValue("staffName", reservation.staffName);
    setValue("menuName", reservation.menuName);
    setValue("reservationDate", reservation.reservationDate);
    setValue("staffExtraCharge", reservation.staffExtraCharge);
    setValue("startTime", reservation.startTime);
    setValue("endTime", reservation.endTime);
    setValue("notes", reservation.notes);
    setValue("price", reservation.price);
    setValue("selectedOptions", reservation.selectedOptions);
    setValue("notes", reservation.notes);
  }, [reservation, setValue]);

  console.log(reservation);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>顧客名</Label>
        <Input {...register("customerName")} {...register("customerName")} />
        <p className="text-red-500">{errors.customerName?.message}</p>
      </div>
      <div>
        <Label>顧客の電話番号</Label>
        <Input {...register("customerPhone")} {...register("customerPhone")} />
        <p className="text-red-500">{errors.customerPhone?.message}</p>
      </div>
      <div>
        <Label>スタッフ名</Label>
        <Input {...register("staffName")} {...register("staffName")} />
        <p className="text-red-500">{errors.staffName?.message}</p>
      </div>
      <div>
        <Label>スタッフの指名料</Label>
        <Input
          {...register("staffExtraCharge")}
          {...register("staffExtraCharge")}
        />
        <p className="text-red-500">{errors.staffExtraCharge?.message}</p>
      </div>
      <div>
        <Label>メニュー名</Label>
        <Input {...register("menuName")} {...register("menuName")} />
        <p className="text-red-500">{errors.menuName?.message}</p>
      </div>
      <div>
        <Label>予約日</Label>
        <Input
          {...register("reservationDate")}
          {...register("reservationDate")}
        />
        <p className="text-red-500">{errors.reservationDate?.message}</p>
      </div>
      <div>
        <Label>開始時間</Label>
        <Input {...register("startTime")} {...register("startTime")} />
        <p className="text-red-500">{errors.startTime?.message}</p>
      </div>
      <div>
        <Label>終了時間</Label>
        <Input {...register("endTime")} {...register("endTime")} />
        <p className="text-red-500">{errors.endTime?.message}</p>
      </div>
      <div>
        <Label>オプション</Label>
        <Select>
          <SelectTrigger>
            <SelectValue
              placeholder={
                reservation.selectedOptions?.[0]?.name || "オプション無し"
              }
              defaultValue={
                reservation.selectedOptions?.[0]?.name || "オプション無し"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {reservation.selectedOptions?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} / ¥
                {option.salePrice ? option.salePrice : option.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>料金</Label>
        <Input {...register("price")} {...register("price")} />
        <p className="text-red-500">{errors.price?.message}</p>
      </div>
      <div>
        <Label>メモ</Label>
        <Textarea {...register("notes")} {...register("notes")} />
        <p className="text-red-500">{errors.notes?.message}</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          戻る
        </Button>
        <Button
          variant="destructive"
          onClick={(e) => handleDelete(e)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "更新中..." : "削除"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "更新中..." : "更新"}
        </Button>
      </div>
    </form>
  );
}
