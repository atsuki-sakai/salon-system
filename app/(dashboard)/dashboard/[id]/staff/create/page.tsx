"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/useZodForm";
import { staffSchema } from "@/lib/validations";
import { useParams } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// const textMenuItems = [
//   {
//     id: "menu_1",
//     name: "カット",
//     category: "カット",
//     price: "3,000円",
//     duration: "約30分",
//     coolingTime: "約10分",
//     availableStaffs: ["山田 花子", "佐藤 太郎"],
//     imageUrl:
//       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
//   },
//   {
//     id: "menu_2",
//     name: "パーマ",
//     category: "パーマ",
//     price: "5,000円",
//     duration: "約60分",
//     coolingTime: "約10分",
//     availableStaffs: ["山田 花子", "佐藤 太郎"],
//     imageUrl:
//       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
//   },
//   {
//     id: "menu_3",
//     name: "カラー",
//     category: "カラー",
//     price: "4,500円",
//     duration: "約45分",
//     coolingTime: "約10分",
//     availableStaffs: ["山田 花子", "佐藤 太郎"],
//     imageUrl:
//       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
//   },
// ];

export default function StaffCreatePage() {
  const params = useParams();
  const id = params.id as string;

  // 休暇日の状態を管理
  const [vacationDates, setVacationDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useZodForm(staffSchema);

  const selectedGender = watch("gender");
  const holidays = watch("holidays") || [];

  // 日付を文字列形式に変換する関数
  const formatDateToString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 文字列から日付に変換する関数
  const parseDateString = (dateString: string): Date => {
    return parseISO(dateString);
  };

  // vacationDatesが変更されたらholidaysフィールドを更新
  useEffect(() => {
    // 日付を文字列の配列に変換してセット
    const formattedDates = vacationDates.map(formatDateToString);
    setValue("holidays", formattedDates);
  }, [vacationDates, setValue]);

  // holidaysが初期値として設定されている場合、vacationDatesを更新
  useEffect(() => {
    if (holidays.length > 0 && vacationDates.length === 0) {
      // 文字列の日付を Date オブジェクトに変換
      const dates = holidays.map(parseDateString);
      setVacationDates(dates);
    }
  }, [holidays]);

  const createStaff = useMutation(api.staffs.createStaff);

  const onSubmit = (data: z.infer<typeof staffSchema>) => {
    try {
      createStaff({
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender || "",
        description: data.description || "",
        image: data.image || "",
        salonId: id,
        holidays: data.holidays || [],
      });
      console.log(data.holidays);
      console.log(data);
      toast.success("スタッフを追加しました");
    } catch (error) {
      console.error(error);
      toast.error("スタッフの追加に失敗しました");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${id}/staff`}>
          <span className="text-sm text-indigo-700 flex items-center justify-start gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>スタッフ一覧</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">スタッフを追加</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6"
      >
        {/* <div>
          <Label htmlFor="image">画像</Label>
          <Input {...register("image")} type="file" />
          {errors.image && <p>{errors.image.message}</p>}
        </div> */}
        <div>
          <Label htmlFor="name" className="font-bold">
            スタッフ名
          </Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm mt-1 text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gender" className="font-bold">
            性別
          </Label>
          <Select
            value={selectedGender}
            onValueChange={(value) =>
              setValue("gender", value as "男性" | "女性")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="性別を選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="男性">男性</SelectItem>
              <SelectItem value="女性">女性</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-500">{errors.gender.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="font-bold">
            メールアドレス
          </Label>
          <Input {...register("email")} />
          {errors.email && (
            <p className="text-sm mt-1 text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">電話番号</Label>
          <Input {...register("phone")} />
          {errors.phone && (
            <p className="text-sm mt-1 text-red-500">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="description" className="font-bold">
            スタッフ紹介
          </Label>
          <Textarea
            {...register("description")}
            className="resize-none focus:shadow-none"
            rows={8}
          />
          {errors.description && (
            <p className="text-sm mt-1 text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <Label className="font-bold">休暇日設定</Label>
          <div className="space-y-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !holidays.length && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {holidays.length > 0 ? (
                    <span className="line-clamp-1">
                      {holidays.length}日選択済み
                    </span>
                  ) : (
                    <span>休暇日を選択してください</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  selected={vacationDates}
                  onSelect={(dates) => {
                    // shadcn/uiのCalendarコンポーネントはundefinedを返す場合があるため、対処
                    if (dates === undefined) return;
                    setVacationDates(dates);
                  }}
                  locale={ja} // 日本語ロケールを使用
                  className="rounded-md border"
                />
                <div className="p-3 border-t flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVacationDates([]);
                      setValue("holidays", []);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    選択解除
                  </Button>
                  <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                    確定
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {holidays.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2 text-sm">選択された休暇日:</h3>
                <div className="flex flex-wrap gap-2">
                  {holidays.map((dateStr, index) => {
                    const date = parseDateString(dateStr);
                    return (
                      <div
                        key={index}
                        className="bg-white px-2 py-1 rounded-md border text-sm flex items-center gap-1"
                      >
                        <span>
                          {format(date, "yyyy年MM月dd日(EEE)", { locale: ja })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            // 選択された日付を削除
                            const newVacationDates = vacationDates.filter(
                              (d) => !isSameDay(d, date)
                            );
                            setVacationDates(newVacationDates);
                            // holidays フィールドも更新
                            const newHolidays = holidays.filter(
                              (d) => d !== dateStr
                            );
                            setValue("holidays", newHolidays);
                          }}
                          className="text-gray-500 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" className="w-fit">
            キャンセル
          </Button>
          <Button
            type="submit"
            className="w-fit"
            variant="default"
            disabled={isSubmitting}
          >
            スタッフを追加
          </Button>
        </div>
      </form>
    </div>
  );
}
