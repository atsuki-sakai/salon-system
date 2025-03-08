//
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useZodForm } from "@/hooks/useZodForm";
import { staffSchema } from "@/lib/validations";
import { z } from "zod";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { FileImage } from "@/components/common";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { Loading } from "@/components/common";

// 空の配列定数（同じ参照を使い回す）
const EMPTY_ARRAY: string[] = [];

export default function EditStaffPage() {
  const { staff_id } = useParams();
  const { id } = useParams(); // salonId
  const router = useRouter();

  // スタッフ情報の取得
  const staff = useQuery(api.staff.getStaff, {
    id: staff_id as Id<"staff">,
  });

  // 休暇日の状態管理
  const [vacationDates, setVacationDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  // フォームの初期化
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useZodForm(staffSchema);

  const selectedGender = watch("gender") as "男性" | "女性" | undefined;
  const watchedHolidays = watch("regularHolidays");
  // watchedHolidays が falsy の場合は EMPTY_ARRAY を返す
  const holidays = useMemo(
    () => (watchedHolidays ? watchedHolidays : EMPTY_ARRAY),
    [watchedHolidays]
  );

  // 日付を文字列形式に変換する関数
  const formatDateToString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 文字列から日付に変換する関数
  const parseDateString = (dateString: string): Date => {
    try {
      return parseISO(dateString);
    } catch (error) {
      console.error("日付の解析エラー:", error);
      return new Date(); // エラー時は現在日付を返す
    }
  };

  // スタッフデータが取得できたらフォームに初期値をセット
  useEffect(() => {
    if (staff && !isFormInitialized) {
      reset({
        name: staff.name || "",
        age: staff.age || 0,
        gender: staff.gender as "全て" | "男性" | "女性" | undefined,
        description: staff.description || "",
        extraCharge: staff.extraCharge || 0,
        imgFileId: staff.imgFileId || "",
        regularHolidays: staff.regularHolidays || [],
      });

      setValue("gender", staff.gender as "男性" | "女性" | undefined);

      // 休暇日の初期化
      if (staff.regularHolidays) {
        try {
          const dates = staff.regularHolidays.map(parseDateString);
          setVacationDates(dates);
        } catch (error) {
          console.error("休暇日の変換エラー:", error);
        }
      }

      setIsFormInitialized(true);
    }
  }, [staff, reset, isFormInitialized, setValue]);

  // 日付が選択されたら holidays フィールドを更新
  useEffect(() => {
    if (vacationDates.length > 0) {
      const formattedDates = vacationDates.map(formatDateToString);
      setValue("regularHolidays", formattedDates);
    }
  }, [vacationDates, setValue]);

  // ⭐ useMutation をコンポーネントのトップレベルに移動
  const deleteStaff = useMutation(api.staff.trash);

  // スタッフ更新ミューテーション
  const updateStaff = useMutation(api.staff.update);
  const deleteFile = useMutation(api.storage.deleteFile);

  const handleDeleteStaff = async () => {
    const alert = await confirm("本当にスタッフを削除しますか？");
    if (alert) {
      try {
        await deleteStaff({
          id: staff_id as Id<"staff">,
        });
        if (staff && staff.imgFileId && staff.imgFileId !== "") {
          await deleteFile({
            storageId: staff.imgFileId,
          });
        }
        toast.success("スタッフを削除しました");
        router.push(`/dashboard/${staff?.salonId}/staff`);
      } catch (error) {
        console.error("スタッフ削除エラー:", error);
        toast.error("スタッフの削除に失敗しました");
      }
    }
  };

  // フォーム送信ハンドラ
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const onSubmit = async (data: z.infer<typeof staffSchema>) => {
    try {
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
      await updateStaff({
        id: staff_id as Id<"staff">,
        name: data.name,
        age: data.age,
        gender: data.gender || "全て",
        description: data.description || "",
        imgFileId: imageFileId || staff?.imgFileId,
        salonId: staff?.salonId || "",
        regularHolidays: data.regularHolidays || [],
      });
      // 新しい画像がアップロードされた場合にのみ、既存の画像を削除する
      if (imageFileId && staff && staff.imgFileId) {
        await deleteFile({
          storageId: staff.imgFileId,
        });
      }

      toast.success("スタッフ情報を更新しました");
      router.push(`/dashboard/${staff?.salonId}/staff`);
    } catch (error) {
      console.error("更新エラー:", error);
      toast.error("スタッフ情報の更新に失敗しました");
    }
  };

  // ローディング表示
  if (!staff) {
    return <Loading />;
  }
  console.log("staff.gender", staff.gender);
  console.log("selectedGender", selectedGender);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${staff?.salonId}/staff`}>
          <span className="text-sm text-indigo-700 flex items-center justify-start gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>スタッフ一覧</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">スタッフ情報の編集</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6"
      >
        <div className="flex gap-4">
          <FileImage fileId={staff.imgFileId} alt={staff.name} size={50} />
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
          <Label htmlFor="gender" className="font-bold">
            性別
          </Label>
          <Select
            value={selectedGender ?? staff.gender}
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
          <Label htmlFor="age">年齢</Label>
          <Input {...register("age", { valueAsNumber: true })} type="number" />
          {errors.age && (
            <p className="text-sm mt-1 text-red-500">{errors.age.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="extraCharge">指名料金</Label>
          <Input
            {...register("extraCharge", { valueAsNumber: true })}
            type="number"
          />
          {errors.extraCharge && (
            <p className="text-sm mt-1 text-red-500">
              {errors.extraCharge.message}
            </p>
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
            <div className="py-3 text-xs text-gray-500">
              <p>
                スタッフの対応メニューはメニュー一覧から編集してください。
                <Link
                  className="underline text-sm text-indigo-600 ml-2"
                  href={`/dashboard/${id}/menus`}
                >
                  メニュー一覧
                </Link>
              </p>
            </div>
            {holidays.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium mb-2 text-sm">選択された休暇日:</h3>
                <div className="flex flex-wrap gap-2">
                  {holidays.map((dateStr, index) => {
                    try {
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
                                (d) => formatDateToString(d) !== dateStr
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
                    } catch (error) {
                      console.error("日付表示エラー:", error);
                      return null;
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/${staff?.salonId}/staff`)}
          >
            戻る
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleDeleteStaff()}
          >
            削除
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "スタッフを更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}
