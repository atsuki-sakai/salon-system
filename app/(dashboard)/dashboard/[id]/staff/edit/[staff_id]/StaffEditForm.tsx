// StaffEditForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useZodForm } from "@/hooks/useZodForm";
import { staffEditSchema } from "@/lib/validations";
import { z } from "zod";
import { handleErrorToMessage } from "@/lib/errors";

import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Save,
  Trash2,
  X,
  Info,
  Upload,
  User,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
  Settings,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { FileImage, ImageDrop, RequiredSubscribe } from "@/components/common";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSalonCore } from "@/hooks/useSalonCore";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// パフォーマンス向上のための空の配列定数（同じ参照を使い回す）
const EMPTY_ARRAY: string[] = [];

// タブ変更アニメーション
const tabContentAnimation = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 },
};

// エラーアニメーション
const errorAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2 },
};

export default function StaffEditForm() {
  const { staff_id } = useParams();
  const { id } = useParams(); // salonId
  const router = useRouter();
  const { isSubscribed } = useSalonCore();

  // スタッフ情報の取得 (React Query のメモ化を利用)
  const staff = useQuery(api.staff.getStaff, {
    id: staff_id as Id<"staff">,
  });

  const staffPinCode = useQuery(api.staff_auth.getStaffPinCode, {
    staffId: staff_id as Id<"staff">,
  });

  console.log("staffPinCode", staffPinCode);

  // 休暇日の状態管理
  const [vacationDates, setVacationDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");

  // フォームの初期化
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useZodForm(staffEditSchema);

  const selectedGender = watch("gender") as "男性" | "女性" | undefined;
  const watchedHolidays = watch("regularHolidays");
  const selectedRole = watch("role");
  // watchedHolidays が falsy の場合は EMPTY_ARRAY を返す (メモ化により再レンダリング回数を削減)
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
        age: staff.age || undefined,
        gender: staff.gender as "全て" | "男性" | "女性" | undefined,
        description: staff.description || "",
        extraCharge: staff.extraCharge || undefined,
        imgFileId: staff.imgFileId || "",
        regularHolidays: staff.regularHolidays || [],
        role: staff.role || "staff",
        email: staff.email || "",
        pin: undefined, // セキュリティのため既存のPINは表示せず、変更時のみ新しいPINを設定
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

  // ミューテーションをトップレベルに移動 (パフォーマンス向上のため)
  const deleteStaff = useMutation(api.staff.trash);
  const updateStaff = useMutation(api.staff.update);
  const deleteFile = useMutation(api.storage.deleteFile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateStaffPin = useAction(api.staff_auth.updateStaffPin);
  const updateStaffLoginInfo = useMutation(api.staff_auth.updateStaffLoginInfo);

  const handleDeleteStaff = async () => {
    try {
      await deleteStaff({
        id: staff_id as Id<"staff">,
        salonId: staff?.salonId || "",
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
  };

  // フォーム送信ハンドラ
  const onSubmit = async (data: z.infer<typeof staffEditSchema>) => {
    try {
      let imageFileId: string | undefined = undefined;

      if (currentImage) {
        const uploadUrl = await generateUploadUrl();
        const results = await fetch(uploadUrl, {
          method: "POST",
          body: currentImage,
          headers: { "Content-Type": currentImage.type },
        });

        const { storageId } = await results.json();
        imageFileId = storageId;
      }

      // スタッフ基本情報の更新
      await updateStaff({
        id: staff_id as Id<"staff">,
        name: data.name,
        age: data.age,
        gender: data.gender || "全て",
        extraCharge: data.extraCharge,
        description: data.description || "",
        imgFileId: imageFileId || staff?.imgFileId,
        salonId: staff?.salonId || "",
        regularHolidays: data.regularHolidays || [],
      });

      // ログイン情報の更新（メール、権限、有効状態）
      if (data.email || data.role) {
        await updateStaffLoginInfo({
          staffId: staff_id as Id<"staff">,
          email: data.email,
          role: data.role,
          isActive: true,
        });
      }

      // PINコードが入力されていれば更新（4桁のPINコードの場合のみ）
      if (data.pin && data.pin.length === 4) {
        await updateStaffPin({
          staffId: staff_id as Id<"staff">,
          pin: data.pin,
        });
      }

      // 新しい画像がアップロードされた場合にのみ、既存の画像を削除する
      if (imageFileId && staff && staff.imgFileId) {
        await deleteFile({
          storageId: staff.imgFileId,
        });
      }

      toast.success("スタッフ情報を更新しました");
      router.push(`/dashboard/${staff?.salonId}/staff`);
    } catch (error) {
      const errorMessage = handleErrorToMessage(error);
      toast.error(errorMessage);
    }
  };
  // ローディング表示
  if (!staff) {
    return <Loading />;
  }

  if (!isSubscribed) {
    return <RequiredSubscribe salonId={staff?.salonId as string} />;
  }

  const handleGoBack = () => {
    router.push(`/dashboard/${staff?.salonId}/staff`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-none mb-8 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                delay: 0.2,
              }}
              className="bg-white bg-opacity-20 p-2 rounded-lg"
            >
              <User className="h-6 w-6 text-white" />
            </motion.div>
            スタッフ情報の編集
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1">
            スタッフ情報を編集して更新してください
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-3 w-full mb-2 bg-slate-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="text-sm tracking-wide font-bold rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 py-1"
                >
                  <User className="h-4 w-4" />
                  基本情報
                </motion.div>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="text-sm tracking-wide font-bold rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 py-1"
                >
                  <Settings className="h-4 w-4" />
                  休暇日設定
                </motion.div>
              </TabsTrigger>
              <TabsTrigger
                value="login"
                className="text-sm tracking-wide font-bold rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 py-1"
                >
                  <Settings className="h-4 w-4" />
                  ログイン設定
                </motion.div>
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === "basic" && (
                  <motion.div
                    key="basic-tab"
                    {...tabContentAnimation}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* 左側のカラム */}
                      <div className="space-y-6">
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Label
                            htmlFor="name"
                            className="font-bold flex items-center gap-2"
                          >
                            <Tag className="h-4 w-4 text-indigo-600" />
                            スタッフ名
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...register("name")}
                            placeholder="例：山田 太郎"
                            aria-invalid={!!errors.name}
                            className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                          />
                          <AnimatePresence>
                            {errors.name && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.name.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label
                            htmlFor="gender"
                            className="font-bold flex items-center gap-2"
                          >
                            <User className="h-4 w-4 text-indigo-600" />
                            性別
                          </Label>
                          <Select
                            value={selectedGender ?? staff.gender}
                            onValueChange={(value) =>
                              setValue("gender", value as "男性" | "女性")
                            }
                          >
                            <SelectTrigger
                              id="gender"
                              className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300"
                            >
                              <SelectValue placeholder="性別を選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="男性">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-blue-500" />
                                  男性
                                </div>
                              </SelectItem>
                              <SelectItem value="女性">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-pink-500" />
                                  女性
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <AnimatePresence>
                            {errors.gender && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.gender.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* 右側のカラム */}
                      <div className="space-y-6">
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Label
                            htmlFor="age"
                            className="font-bold flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4 text-indigo-600" />
                            年齢
                          </Label>
                          <Input
                            id="age"
                            {...register("age", { valueAsNumber: true })}
                            type="number"
                            placeholder="例：30"
                            aria-invalid={!!errors.age}
                            className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                          />
                          <AnimatePresence>
                            {errors.age && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.age.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Label
                            htmlFor="extraCharge"
                            className="font-bold flex items-center gap-2"
                          >
                            <DollarSign className="h-4 w-4 text-indigo-600" />
                            指名料金（円）
                          </Label>
                          <Input
                            id="extraCharge"
                            {...register("extraCharge", {
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="例：1000"
                            aria-invalid={!!errors.extraCharge}
                            className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                          />
                          <AnimatePresence>
                            {errors.extraCharge && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.extraCharge.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    </div>

                    {/* スタッフ画像セクション */}
                    <motion.div
                      className="space-y-2 pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label
                        htmlFor="imageFile"
                        className="font-bold flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4 text-indigo-600" />
                        スタッフ画像
                      </Label>
                      <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-dashed border-indigo-200 dark:border-gray-700">
                        <div className="flex items-start gap-4">
                          <div className="w-2/5 flex items-center justify-center">
                            <FileImage
                              fileId={staff.imgFileId as string}
                              alt={staff.name}
                              size={128}
                              className="rounded-lg shadow-md"
                            />
                          </div>

                          <div className="w-3/5">
                            <ImageDrop
                              onFileSelect={(file) => {
                                setCurrentImage(file);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* スタッフ紹介セクション */}
                    <motion.div
                      className="space-y-2 pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label
                        htmlFor="description"
                        className="font-bold flex items-center gap-2"
                      >
                        <Info className="h-4 w-4 text-indigo-600" />
                        スタッフ紹介
                      </Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="スタッフの紹介文を入力してください"
                        aria-invalid={!!errors.description}
                        rows={8}
                        className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                      />
                      <AnimatePresence>
                        {errors.description && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.description.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div
                    key="details-tab"
                    {...tabContentAnimation}
                    className="space-y-6"
                  >
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label
                        htmlFor="vacationDates"
                        className="font-bold flex items-center gap-2"
                      >
                        <CalendarIcon className="h-4 w-4 text-indigo-600" />
                        休暇日設定
                      </Label>
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal transition-all border-indigo-100 hover:border-indigo-300",
                              !holidays.length && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
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
                              className="text-destructive hover:text-destructive hover:bg-red-50 transition-all duration-300"
                            >
                              <X className="mr-1 w-3 h-3" />
                              選択解除
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setIsCalendarOpen(false)}
                              className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
                            >
                              確定
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </motion.div>

                    <motion.div
                      className="py-3 text-xs text-gray-500 bg-slate-50 dark:bg-gray-800 rounded-md p-3 border border-indigo-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-indigo-500" />
                        スタッフの対応メニューは
                        <Link
                          className="underline text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                          href={`/dashboard/${id}/menu`}
                        >
                          メニュー一覧
                        </Link>
                        から編集してください。
                      </p>
                    </motion.div>

                    <AnimatePresence>
                      {holidays.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border rounded-md p-4 bg-indigo-50/50 border-indigo-100"
                        >
                          <h3 className="font-medium mb-3 text-sm text-indigo-700 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            選択された休暇日:
                          </h3>
                          <ScrollArea className="h-56 pr-4">
                            <div className="flex flex-wrap gap-2">
                              {holidays.map((dateStr, index) => {
                                try {
                                  const date = parseDateString(dateStr);
                                  return (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.2 }}
                                      key={index}
                                      className="group"
                                      layout
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="bg-white border px-3 py-1.5 transition-all group-hover:bg-red-50 flex items-center border-indigo-200"
                                      >
                                        <CalendarIcon className="h-3 w-3 mr-2 text-indigo-500" />
                                        <span>
                                          {format(date, "yyyy年MM月dd日(EEE)", {
                                            locale: ja,
                                          })}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newVacationDates =
                                              vacationDates.filter(
                                                (d) =>
                                                  formatDateToString(d) !==
                                                  dateStr
                                              );
                                            setVacationDates(newVacationDates);
                                            const newHolidays = holidays.filter(
                                              (d) => d !== dateStr
                                            );
                                            setValue(
                                              "regularHolidays",
                                              newHolidays
                                            );
                                          }}
                                          className="ml-2 text-gray-400 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded-full transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </Badge>
                                    </motion.div>
                                  );
                                } catch (error) {
                                  console.error("日付表示エラー:", error);
                                  return null;
                                }
                              })}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                {activeTab === "login" && (
                  <motion.div
                    key="login-tab"
                    {...tabContentAnimation}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-indigo-600"
                        >
                          <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="2"
                          ></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        メールアドレス
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        {...register("email")}
                        placeholder="例：staff@example.com"
                        className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                        aria-invalid={!!errors.email}
                      />
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-indigo-600" />
                        PINコード<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          {...register("pin")}
                          placeholder="4桁の数字（例：1234）"
                          type={showPin ? "text" : "password"}
                          value={pinInput}
                          onChange={(e) => {
                            // 4桁の数字のみ許可
                            const value = e.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 4);
                            setPinInput(value);
                            setValue("pin", value);
                          }}
                          className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300 pr-10"
                          aria-invalid={!!errors.pin}
                          maxLength={4}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.pin && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.pin.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 italic">
                            PINコードは4桁の数字で入力してください
                          </p>
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            {staff.pinCode ? (
                              <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-md p-2 mr-4">
                                現在PINコードは設定されています。変更する場合のみ新しいPINを入力してください。
                                <br />
                                ※PINコードを忘れた場合は再度生成して登録してください。
                              </div>
                            ) : (
                              <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md p-2 mr-4">
                                PINコードが設定されていません。新しいPINを登録してください。
                                <br />
                                ※PINコードを忘れた場合は再度生成して登録してください。
                              </div>
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs text-blue-500 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            // 4桁のランダムなPINを生成
                            const randomPin = Math.floor(
                              1000 + Math.random() * 9000
                            ).toString();
                            setPinInput(randomPin);
                            setValue("pin", randomPin);
                            setShowPin(true); // 新しいPINを表示
                          }}
                        >
                          ランダムPINを生成
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">
                        権限<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => {
                          setValue(
                            "role",
                            value as "admin" | "manager" | "staff",
                            { shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger
                          id="role"
                          className={cn(
                            "border-indigo-100 focus:ring-indigo-500 transition-all duration-300",
                            errors.role && "border-red-500"
                          )}
                        >
                          <SelectValue placeholder="スタッフの権限を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">スタッフ</SelectItem>
                          <SelectItem value="manager">マネージャー</SelectItem>
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {errors.role && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.role.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-xs text-blue-700 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>
                            <span className="font-medium">権限の種類: </span>
                            スタッフ（通常の操作）、マネージャー（スタッフ管理）ごとに利用可能な機能が異なります。
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex justify-between gap-4 pt-8 mt-4 border-t"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex gap-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoBack}
                      className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300"
                    >
                      <ArrowLeft className="h-4 w-4" /> 戻る
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <AlertDialog
                      open={isDeleteDialogOpen}
                      onOpenChange={setIsDeleteDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={isSubmitting}
                          className="gap-2 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" /> 削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>スタッフの削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            本当にスタッフ「{staff.name}」を削除しますか？
                            この操作は元に戻せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isSubmitting}>
                            戻る
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteStaff();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "削除中..." : "削除する"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                      >
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </motion.div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSubmitting ? "更新中..." : "スタッフを更新"}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
