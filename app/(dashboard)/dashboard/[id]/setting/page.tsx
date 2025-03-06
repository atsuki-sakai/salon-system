"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/useZodForm";
import { settingSchema } from "@/lib/validations";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function SettingPage() {
  const { id } = useParams();
  console.log("salonId:", id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useZodForm(settingSchema, {
    defaultValues: {
      salonId: id as string,
    },
  });

  // カレンダー表示の制御用状態
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 日付を文字列 (yyyy-MM-dd) に変換する関数
  const formatDateToString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  const createSetting = useMutation(api.settings.createSetting);
  const updateSetting = useMutation(api.settings.updateSetting);
  const existSetting = useQuery(api.settings.existSetting, {
    salonId: id as string,
  });
  const mySettings = useQuery(api.settings.getSetting, {
    salonId: id as string,
  });

  // 固定日付選択用の state。初期値は空配列にして、mySettings 取得後に更新する
  const [holidayDates, setHolidayDates] = useState<Date[]>([]);

  const onSubmit = async (data: z.infer<typeof settingSchema>) => {
    console.log("Form submitted:", data);
    try {
      const settingData = {
        ...data,
        salonId: id as string,
      };

      if (existSetting) {
        await updateSetting(settingData);
      } else {
        await createSetting(settingData);
      }
      toast.success("設定を保存しました");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  const handleRemoveHoliday = (date: Date) => {
    const newDates = holidayDates.filter(
      (d) => formatDateToString(d) !== formatDateToString(date)
    );
    setHolidayDates(newDates);
    setValue("holidays", newDates.map(formatDateToString));
  };

  useEffect(() => {
    if (mySettings) {
      console.log("mySettings:", mySettings);
      // holidays は mySettings.holidays が文字列の配列で返ってくると仮定し、Date 型に変換する
      const holidaysFromSettings = mySettings.holidays
        ? mySettings.holidays.map((dateStr: string) => new Date(dateStr))
        : [];
      setHolidayDates(holidaysFromSettings);

      reset({
        salonName: mySettings.salonName,
        email: mySettings.email,
        phone: mySettings.phone,
        address: mySettings.address,
        openTime: mySettings.openTime,
        closeTime: mySettings.closeTime,
        holidays: mySettings.holidays, // ここは文字列の配列
        description: mySettings.description,
        salonId: id as string,
      });
    }
  }, [mySettings, reset, id]);

  return (
    <div className="max-w-4xl mx-auto">
      <h4 className="text-lg font-bold">サロン設定</h4>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 space-y-6"
      >
        {/* 各種基本設定 */}
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="salonName">
            サロン名
          </Label>
          <Input id="salonName" {...register("salonName")} className="mt-2" />
          {errors.salonName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.salonName.message}
            </p>
          )}
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="email">
            メールアドレス
          </Label>
          <Input id="email" {...register("email")} className="mt-2" />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="phone">
            電話番号
          </Label>
          <Input id="phone" {...register("phone")} className="mt-2" />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="address">
            住所
          </Label>
          <Input id="address" {...register("address")} className="mt-2" />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">
              {errors.address.message}
            </p>
          )}
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="openTime">
            営業時間
          </Label>
          <Input id="openTime" {...register("openTime")} className="mt-2" />
          {errors.openTime && (
            <p className="text-red-500 text-sm mt-1">
              {errors.openTime.message}
            </p>
          )}
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="closeTime">
            閉店時間
          </Label>
          <Input id="closeTime" {...register("closeTime")} className="mt-2" />
          {errors.closeTime && (
            <p className="text-red-500 text-sm mt-1">
              {errors.closeTime.message}
            </p>
          )}
        </div>

        {/* 定休日（日付選択） */}
        <div className="mt-4">
          <Label className="text-sm font-medium">定休日（日付選択）</Label>
          <div className="mt-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {holidayDates.length > 0
                    ? `${holidayDates.length}日選択済み`
                    : "定休日を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="multiple"
                  selected={holidayDates}
                  onSelect={(dates) => {
                    if (dates) {
                      setHolidayDates(dates);
                      setValue("holidays", dates.map(formatDateToString));
                    }
                  }}
                  locale={ja}
                />
                <div className="p-3 border-t flex justify-end">
                  <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                    確定
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full mt-4">
            <span className="text-sm font-medium">選択中の定休日</span>
            <div className="flex flex-wrap gap-2 mt-4">
              {holidayDates.length > 0 ? (
                holidayDates.map((date) => (
                  <div
                    key={date.toISOString()}
                    className="flex items-center gap-1 rounded bg-gray-50 shadow-sm px-2 py-1"
                  >
                    <span className="text-sm mr-2">
                      {formatDateToString(date)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveHoliday(date)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  定休日は選択されていません。
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-sm font-medium" htmlFor="description">
            サロンの説明
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            className="mt-2"
            rows={10}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </form>
    </div>
  );
}
