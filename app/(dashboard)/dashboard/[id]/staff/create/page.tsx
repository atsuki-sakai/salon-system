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
import { useState, useEffect, useMemo, useRef } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
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

// 空の配列は同じ参照で使い回す
const EMPTY_ARRAY: string[] = [];

export default function StaffCreatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 休暇日の状態を管理
  const [vacationDates, setVacationDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useZodForm(staffSchema);

  const selectedGender = watch("gender");
  const watchedHolidays = watch("regularHolidays");

  // watchedHolidays が falsy の場合は EMPTY_ARRAY を返す
  const holidays = useMemo(
    () => watchedHolidays || EMPTY_ARRAY,
    [watchedHolidays]
  );

  // 日付を文字列形式に変換する関数
  const formatDateToString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 文字列から日付に変換する関数
  const parseDateString = (dateString: string): Date => {
    return parseISO(dateString);
  };

  // vacationDates が変更されたら holidays フィールドを更新
  useEffect(() => {
    const formattedDates = vacationDates.map(formatDateToString);
    setValue("regularHolidays", formattedDates);
  }, [vacationDates, setValue]);

  // holidays が初期値として設定されている場合、vacationDates を更新
  useEffect(() => {
    if (holidays.length > 0 && vacationDates.length === 0) {
      const dates = holidays.map(parseDateString);
      setVacationDates(dates);
    }
  }, [holidays, vacationDates]);
  console.log(id);

  const addStaff = useMutation(api.staff.add);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const onSubmit = async (data: z.infer<typeof staffSchema>) => {
    console.log("clicked");
    try {
      console.log(data);
      let imageFileId: string | undefined = undefined;
      if (
        imageFileRef.current?.files &&
        imageFileRef.current.files.length > 0
      ) {
        const file = imageFileRef.current.files[0];
        const maxSize = 2 * 1024 * 1024;
        if (file && file.size > maxSize) {
          toast.error(
            "ファイルサイズが大きすぎます。2MB以下の画像をアップロードしてください。"
          );
          return;
        }
        console.log(file);
        const uploadUrl = await generateUploadUrl();
        console.log(uploadUrl);
        const results = await fetch(uploadUrl, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file ? file.type : "image/png" },
        });
        console.log(results);
        const { storageId } = await results.json();
        imageFileId = storageId;
      }
      addStaff({
        salonId: id,
        name: data.name,
        age: data.age,
        gender: data.gender || "全て",
        description: data.description || "",
        imgFileId: imageFileId,
        extraCharge: data.extraCharge,
        regularHolidays: data.regularHolidays || [],
      });
      console.log(data.regularHolidays);
      console.log(data);
      router.push(`/dashboard/${id}/staff`);
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
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log(errors);
        })}
        className="flex flex-col space-y-6"
      >
        <div>
          <Label htmlFor="imageFile">
            スタッフ画像 <br />
            <span className="text-xs text-gray-500">
              2MB以下の画像をアップロードしてください
            </span>
          </Label>
          <Input
            {...register("imgFileId")}
            type="file"
            ref={imageFileRef}
            accept="image/*"
          />

          {errors.imgFileId && <p>{errors.imgFileId.message}</p>}
        </div>
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
          <Label htmlFor="age" className="font-bold">
            年齢
          </Label>
          <Input {...register("age", { valueAsNumber: true })} type="number" />
          {errors.age && (
            <p className="text-sm mt-1 text-red-500">{errors.age.message}</p>
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
          <Label htmlFor="extraCharge" className="font-bold">
            指名料金
          </Label>
          <Input
            {...register("extraCharge", { valueAsNumber: true })}
            type="number"
          />
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
                    // shadcn/ui の Calendar コンポーネントは undefined を返す場合があるため対処
                    if (dates === undefined) return;
                    setVacationDates(dates);
                  }}
                  locale={ja}
                  className="rounded-md border"
                />
                <div className="p-3 border-t flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVacationDates([]);
                      setValue("regularHolidays", []);
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
                          {format(date, "yyyy年MM月dd日(EEE)", {
                            locale: ja,
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newVacationDates = vacationDates.filter(
                              (d) => !isSameDay(d, date)
                            );
                            setVacationDates(newVacationDates);
                            const newHolidays = holidays.filter(
                              (d) => d !== dateStr
                            );
                            setValue("regularHolidays", newHolidays);
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
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => router.push(`/dashboard/${id}/staff`)}
          >
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