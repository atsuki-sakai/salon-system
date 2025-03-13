"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Save,
  User,
  FileText,
  Scissors,
  AlertCircle,
  Users,
  Info,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  Gift,
  DollarSign,
} from "lucide-react";
import {
  FaCut,
  FaClock,
  FaCalendarAlt,
  FaCheck,
  FaGift,
  FaTag,
} from "react-icons/fa";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Doc } from "@/convex/_generated/dataModel";

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
import { ja } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/common";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// オプションタイプの定義
type SalonOption = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  maxCount?: number;
};

// 選択したオプションタイプ
type SelectedOption = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  count: number;
};

// 予約情報のスキーマ
const reservationSchema = z.object({
  customerFullName: z.string().min(1, "お客様名を入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください"),
  staffId: z.string().min(1, "スタッフを選択してください"),
  menuId: z.string().min(1, "メニューを選択してください"),
  reservationDate: z.string().min(1, "予約日を選択してください"),
  startTime: z.string().min(1, "開始時間を選択してください"),
  note: z.string().optional(),
});

// アニメーション用の変数
const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// エラーアニメーション
const errorAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2 },
};

// 時刻文字列 "HH:mm" を分数に変換
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

export default function ReservationCreateForm() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useZodForm(reservationSchema);

  // 全スタッフと全メニューの取得
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });
  const salonConfig = useQuery(api.salon_config.getSalonConfig, { salonId });
  const salonOptions = useMemo(() => salonConfig?.options || [], [salonConfig]);

  const { results: menus } = usePaginatedQuery(
    api.menu.getMenusBySalonId,
    {
      salonId,
    },
    {
      initialNumItems: 100,
    }
  );
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
  const watchedMenuId = watch("menuId");

  // 選択した日付をフォーマットして表示
  const formattedDate = useMemo(() => {
    if (!watchedReservationDate) return null;

    try {
      return format(new Date(watchedReservationDate), "yyyy年M月d日(EEE)", {
        locale: ja,
      });
    } catch (e: unknown) {
      console.error("Error formatting date:", e);
      return null;
    }
  }, [watchedReservationDate]);

  // 予約済み情報の取得（予約日が入力されている場合のみ）
  const reservationsForDate = useQuery(
    api.reservation.getReservationsByDate,
    watchedReservationDate ? { salonId, date: watchedReservationDate } : "skip"
  );

  // スタッフの予約情報をメモ化
  const staffReservations = useMemo(() => {
    if (!reservationsForDate || !watchedStaffId) return [];

    return reservationsForDate
      .filter((res: Doc<"reservation">) => res.staffId === watchedStaffId)
      .map((res: Doc<"reservation">) => {
        const startPart = res.startTime.split("T")[1] ?? "00:00";
        const endPart = res.endTime.split("T")[1] ?? "00:00";
        return {
          start: timeStringToMinutes(startPart),
          end: timeStringToMinutes(endPart),
          customerName: res.customerFullName,
          menuName: res.menuName,
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [reservationsForDate, watchedStaffId]);

  // 選択したスタッフ情報を取得
  const selectedStaff = useMemo(() => {
    if (!staffs || !watchedStaffId) return null;
    return staffs.find((staff: Doc<"staff">) => staff._id === watchedStaffId);
  }, [staffs, watchedStaffId]);

  // 日付選択ハンドラ
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formattedDate = format(date, "yyyy-MM-dd");
        setValue("reservationDate", formattedDate);
        setIsCalendarOpen(false);
      }
    },
    [setValue]
  );

  // トータル価格の計算 (メニュー価格 + 指名料 + オプション価格)
  useEffect(() => {
    let basePrice = 0;
    let designationFee = 0;
    let optionsPrice = 0;

    // メニュー価格
    if (selectedMenu) {
      basePrice = selectedMenu.salePrice || selectedMenu.price;
    }

    // 指名料
    if (selectedStaff && selectedStaff.extraCharge) {
      designationFee = selectedStaff.extraCharge;
    }

    // オプション価格
    if (selectedOptions.length > 0) {
      optionsPrice = selectedOptions.reduce((sum, option) => {
        const price =
          option.salePrice !== undefined ? option.salePrice : option.price;
        return sum + price * option.count;
      }, 0);
    }

    // 合計価格セット
    setTotalPrice(basePrice + designationFee + optionsPrice);
  }, [selectedMenu, selectedStaff, selectedOptions]);

  // 時間枠を計算
  useEffect(() => {
    if (
      watchedReservationDate &&
      watchedStaffId &&
      selectedMenu &&
      reservationsForDate
    ) {
      // 営業時間を取得
      const open = timeStringToMinutes(salonConfig?.regularOpenTime ?? "09:00");
      const close = timeStringToMinutes(
        salonConfig?.regularCloseTime ?? "19:00"
      );

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
    staffReservations,
    salonConfig,
  ]);

  // オプション選択/更新ハンドラ
  const handleOptionChange = useCallback(
    (option: SalonOption, count: number) => {
      setSelectedOptions((prev) => {
        // 既存のオプションを確認
        const existingOptionIndex = prev.findIndex(
          (opt) => opt.id === option.id
        );

        // 新しい配列を作成
        const newOptions = [...prev];

        if (count <= 0) {
          // カウントが0以下の場合、オプションを削除
          if (existingOptionIndex !== -1) {
            newOptions.splice(existingOptionIndex, 1);
          }
        } else {
          // カウントが1以上の場合
          const maxCount = option.maxCount || 10; // デフォルトの最大数
          const validCount = Math.min(count, maxCount);

          if (existingOptionIndex !== -1) {
            // 既存のオプションを更新
            newOptions[existingOptionIndex] = {
              ...option,
              count: validCount,
            };
          } else {
            // 新しいオプションを追加
            newOptions.push({
              ...option,
              count: validCount,
            });
          }
        }

        return newOptions;
      });
    },
    []
  );

  // オプションのカウントを取得
  const getOptionCount = useCallback(
    (optionId: string) => {
      const option = selectedOptions.find((opt) => opt.id === optionId);
      return option ? option.count : 0;
    },
    [selectedOptions]
  );

  if (!staffs || !menus) {
    return <Loading />;
  }

  // メニュー選択時の処理：選択されたメニューに基づいて、対応可能なスタッフ（menu.staffIdsに含まれるもの）のみを抽出
  const handleMenuSelect = (menuId: string) => {
    setValue("menuId", menuId);
    const menu = menus.find((m: Doc<"menu">) => m._id === menuId);
    setSelectedMenu(menu || null);

    if (menu) {
      // スタッフをフィルタリング
      const availableStaffs = staffs.filter((staff: Doc<"staff">) =>
        menu.availableStaffIds.includes(staff._id)
      );
      setFilteredStaffs(availableStaffs);

      // 既存のスタッフが対応可能なスタッフに含まれていない場合はクリア
      if (
        watchedStaffId &&
        !availableStaffs.some((staff) => staff._id === watchedStaffId)
      ) {
        setValue("staffId", "");
      }
    } else {
      setFilteredStaffs([]);
      setValue("staffId", "");
    }

    // すでに開始時間が選択されている場合、終了時刻を再計算
    calculateEndTime(
      menu ? { timeToMin: menu.timeToMin } : null,
      watchedStartTime
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
      setIsSubmittingForm(true);

      const selectedStaff = staffs.find(
        (staff: Doc<"staff">) => staff._id === data.staffId
      );
      const selectedMenu = menus.find(
        (menu: Doc<"menu">) => menu._id === data.menuId
      );

      if (!selectedStaff || !selectedMenu) {
        toast.error("スタッフまたはメニューの選択が無効です");
        setIsSubmittingForm(false);
        return;
      }

      const startDateTime = `${data.reservationDate}T${data.startTime}`;
      const endDateTime = format(
        new Date(
          new Date(startDateTime).getTime() + selectedMenu.timeToMin * 60000
        ),
        "yyyy-MM-dd'T'HH:mm"
      );

      // 選択されたオプションをAPIに渡す形式に変換
      const formattedOptions = selectedOptions.map((option) => ({
        id: option.id,
        name: option.name,
        price: option.salePrice !== undefined ? option.salePrice : option.price,
        quantity: option.count,
      }));

      await createReservation({
        customerId: "temporary-id",
        customerFullName: data.customerFullName,
        customerPhone: data.customerPhone,
        staffId: selectedStaff._id,
        staffName: selectedStaff.name || "",
        staffExtraCharge: selectedStaff.extraCharge || 0,
        menuId: selectedMenu._id,
        menuName: selectedMenu.name,
        totalPrice: totalPrice,
        salonId,
        salonName: salonConfig?.salonName || "",
        reservationDate: data.reservationDate,
        status: "confirmed",
        startTime: startDateTime,
        endTime: endDateTime,
        notes: data.note || "",
        selectedOptions: formattedOptions,
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
                <p className="font-bold">予約が重複しています</p>
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
            setIsSubmittingForm(false);
            return;
          }
        } catch (parseError) {
          console.error("Error parsing error message:", parseError);
        }
      }

      toast.error("予約の作成に失敗しました");
      setIsSubmittingForm(false);
    }
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
              <CalendarIcon className="h-6 w-6 text-white" />
            </motion.div>
            予約情報入力
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1">
            お客様情報とご希望のメニュー・日時を入力してください
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 顧客情報セクション */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-indigo-100 p-4"
            >
              <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                お客様情報
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="customerName"
                    className="font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-indigo-600" />
                    お客様名
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerFullName"
                    {...register("customerFullName")}
                    placeholder="例：山田 太郎"
                    className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                  />
                  <AnimatePresence>
                    {errors.customerFullName && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.customerFullName.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="customerPhone"
                    className="font-medium flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-indigo-600" />
                    電話番号
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    type="tel"
                    placeholder="例：09012345678"
                    className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                  />
                  <AnimatePresence>
                    {errors.customerPhone && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.customerPhone.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* メニューとスタッフセクション */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-indigo-100 p-4"
            >
              <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                <FaCut className="h-4 w-4 text-indigo-600" />
                メニューとスタッフ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="menuId"
                    className="font-medium flex items-center gap-2"
                  >
                    <Scissors className="h-4 w-4 text-indigo-600" />
                    メニュー
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={handleMenuSelect}
                    value={watchedMenuId}
                  >
                    <SelectTrigger
                      id="menuId"
                      className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300"
                    >
                      <SelectValue placeholder="メニューを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {menus.map((menu: Doc<"menu">) => (
                        <SelectItem key={menu._id} value={menu._id}>
                          <div className="flex items-center gap-2">
                            <FaCut className="h-3 w-3 text-indigo-500" />
                            {menu.name}
                            <Badge variant="outline" className="ml-1 text-xs">
                              {menu.timeToMin}分
                            </Badge>
                            {menu.salePrice && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                セール中
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {errors.menuId && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.menuId.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {selectedMenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm mt-2 p-2 bg-indigo-50 rounded border border-indigo-100"
                    >
                      <div className="flex items-center gap-1 text-indigo-700">
                        <Info className="h-3 w-3" />
                        <span className="font-medium">メニュー情報:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaClock className="h-2.5 w-2.5" />
                          所要時間: {selectedMenu.timeToMin}分
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-xs">¥</span>
                          価格: {selectedMenu.price.toLocaleString()}円
                          {selectedMenu.salePrice && (
                            <span className="text-green-600 text-xs ml-1">
                              →{selectedMenu.salePrice.toLocaleString()}円
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="staffId"
                    className="font-medium flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-indigo-600" />
                    担当スタッフ
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("staffId", value)}
                    value={watchedStaffId}
                  >
                    <SelectTrigger
                      id="staffId"
                      className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300"
                    >
                      <SelectValue placeholder="スタッフを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStaffs.length > 0 ? (
                        filteredStaffs.map((staff: Doc<"staff">) => (
                          <SelectItem key={staff._id} value={staff._id}>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-indigo-500" />
                              {staff.name}
                              {staff.extraCharge && (
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-xs"
                                >
                                  +{staff.extraCharge}円
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-staff" disabled>
                          対応可能なスタッフなし
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {errors.staffId && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.staffId.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {selectedStaff && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm mt-2 p-2 bg-indigo-50 rounded border border-indigo-100"
                    >
                      <div className="flex items-center gap-1 text-indigo-700">
                        <Info className="h-3 w-3" />
                        <span className="font-medium">スタッフ情報:</span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        {selectedStaff.extraCharge ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">¥</span>
                            指名料: {selectedStaff.extraCharge.toLocaleString()}
                            円
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <FaCheck className="h-2.5 w-2.5 text-green-500" />
                            指名料なし
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 日時セクション */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-indigo-100 p-4"
            >
              <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="h-4 w-4 text-indigo-600" />
                予約日時
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="reservationDate"
                    className="font-medium flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4 text-indigo-600" />
                    予約日
                    <span className="text-red-500">*</span>
                  </Label>

                  {/* カレンダーコンポーネントを使用 */}
                  <div className="relative">
                    <input type="hidden" {...register("reservationDate")} />
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-indigo-100 focus:ring-indigo-500"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                          {formattedDate ? (
                            formattedDate
                          ) : (
                            <span className="text-muted-foreground">
                              予約日を選択してください
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            watchedReservationDate
                              ? new Date(watchedReservationDate)
                              : undefined
                          }
                          onSelect={handleDateSelect}
                          initialFocus
                          disabled={{ before: new Date() }}
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <AnimatePresence>
                    {errors.reservationDate && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.reservationDate.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="startTime"
                    className="font-medium flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-indigo-600" />
                    開始時間
                    <span className="text-red-500">*</span>
                  </Label>
                  <div>
                    <Select
                      onValueChange={handleStartTimeSelect}
                      value={watchedStartTime}
                    >
                      <SelectTrigger
                        id="startTime"
                        className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300"
                      >
                        <SelectValue placeholder="開始時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-indigo-500" />
                                {time}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-slots" disabled>
                            <div className="text-gray-500 italic flex items-center gap-2">
                              <Info className="h-3 w-3" />
                              選択中の日付・スタッフで空き時間なし
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <AnimatePresence>
                    {errors.startTime && (
                      <motion.p
                        {...errorAnimation}
                        className="text-sm mt-1 text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.startTime.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {endTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded border border-indigo-100 text-sm"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-indigo-800">
                              <Clock className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="font-medium">
                                終了予定時間: {endTime}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              選択したメニューの所要時間に基づいて自動計算されます
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* スタッフの予約状況を表示 */}
              {watchedStaffId &&
                watchedReservationDate &&
                staffReservations.length > 0 && (
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem
                      value="reservations"
                      className="border-indigo-100"
                    >
                      <AccordionTrigger className="hover:text-indigo-700 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-indigo-500" />
                          選択した日のスタッフ予約状況
                          <Badge className="ml-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                            {staffReservations.length}件
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm p-2 bg-slate-50 rounded-md">
                          {staffReservations.map((res, index) => (
                            <div
                              key={index}
                              className="p-2 border rounded-md bg-white"
                            >
                              <div className="flex justify-between">
                                <div className="font-medium text-indigo-800">
                                  {minutesToTimeString(res.start)} ~{" "}
                                  {minutesToTimeString(res.end)}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {res.customerName}様
                                </Badge>
                              </div>
                              <div className="text-gray-600 text-xs mt-1">
                                {res.menuName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
            </motion.div>

            {/* オプション選択セクション */}
            {salonOptions && salonOptions.length > 0 && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg border border-indigo-100 p-4"
              >
                <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                  <FaGift className="h-4 w-4 text-indigo-600" />
                  オプション
                </h2>

                <div className="space-y-4">
                  {salonOptions.map((option: SalonOption) => {
                    const count = getOptionCount(option.id);
                    const isSelected = count > 0;
                    const price =
                      option.salePrice !== undefined
                        ? option.salePrice
                        : option.price;
                    const maxCount = option.maxCount || 10;

                    return (
                      <motion.div
                        key={option.id}
                        className={`p-3 rounded-md border ${isSelected ? "border-indigo-200 bg-indigo-50" : "border-gray-200"}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{option.name}</h3>
                              {option.salePrice && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  セール
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <FaTag className="h-3 w-3 mr-1 text-indigo-500" />
                                {option.salePrice ? (
                                  <span>
                                    <span className="line-through text-gray-400 mr-1">
                                      {option.price.toLocaleString()}円
                                    </span>
                                    <span className="font-medium text-green-600">
                                      {option.salePrice.toLocaleString()}円
                                    </span>
                                  </span>
                                ) : (
                                  <span>{option.price.toLocaleString()}円</span>
                                )}
                              </span>
                              {option.maxCount && (
                                <span className="text-xs text-gray-500">
                                  最大{option.maxCount}つまで
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isSelected ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                                onClick={() => handleOptionChange(option, 1)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                追加
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 border-indigo-200"
                                  onClick={() =>
                                    handleOptionChange(option, count - 1)
                                  }
                                  disabled={count <= 0}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-6 text-center font-medium">
                                  {count}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 border-indigo-200"
                                  onClick={() =>
                                    handleOptionChange(option, count + 1)
                                  }
                                  disabled={count >= maxCount}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 text-sm text-indigo-700 flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>
                              {count}個追加済み (
                              {(price * count).toLocaleString()}円)
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {selectedOptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-3  rounded-md border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-green-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        選択したオプション:
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setSelectedOptions([])}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        クリア
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Gift className="h-3.5 w-3.5 text-green-600" />
                            <span>{option.name}</span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-100 text-green-700 border-green-200"
                            >
                              {option.count}個
                            </Badge>
                          </div>
                          <div className="font-medium">
                            {(
                              (option.salePrice !== undefined
                                ? option.salePrice
                                : option.price) * option.count
                            ).toLocaleString()}
                            円
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 料金サマリーセクション */}
            {selectedMenu && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg border border-indigo-200 p-4"
              >
                <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                  料金サマリー
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-3.5 w-3.5 text-indigo-500" />
                      メニュー: {selectedMenu.name}
                    </div>
                    <div>
                      {selectedMenu.salePrice ? (
                        <div className="flex items-center gap-1">
                          <span className="line-through text-gray-400 text-xs">
                            {selectedMenu.price.toLocaleString()}円
                          </span>
                          <span className="font-medium">
                            {selectedMenu.salePrice.toLocaleString()}円
                          </span>
                        </div>
                      ) : (
                        <span>{selectedMenu.price.toLocaleString()}円</span>
                      )}
                    </div>
                  </div>

                  {selectedStaff &&
                    selectedStaff.extraCharge &&
                    selectedStaff.extraCharge > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-indigo-500" />
                          指名料: {selectedStaff.name}
                        </div>
                        <div>
                          {selectedStaff.extraCharge.toLocaleString()}円
                        </div>
                      </div>
                    )}

                  {selectedOptions.length > 0 && (
                    <>
                      {selectedOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex justify-between items-center py-2 border-b border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Gift className="h-3.5 w-3.5 text-indigo-500" />
                            {option.name} × {option.count}
                          </div>
                          <div>
                            {(
                              (option.salePrice !== undefined
                                ? option.salePrice
                                : option.price) * option.count
                            ).toLocaleString()}
                            円
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="flex justify-between items-center pt-3 font-bold">
                    <div className="text-base">合計</div>
                    <div className="text-base">
                      {totalPrice.toLocaleString()}円
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 備考セクション */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border border-indigo-100 p-4"
            >
              <h2 className="text-lg font-medium text-indigo-800 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                備考
              </h2>
              <div className="space-y-2">
                <Label
                  htmlFor="note"
                  className="font-medium flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  特記事項
                </Label>
                <Textarea
                  id="note"
                  {...register("note")}
                  rows={4}
                  placeholder="お客様からの要望や特記事項があればご記入ください"
                  className="resize-none border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                />
                <AnimatePresence>
                  {errors.note && (
                    <motion.p
                      {...errorAnimation}
                      className="text-sm mt-1 text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.note.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* アクションボタン */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-end gap-4 pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  キャンセル
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting || isSubmittingForm}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                >
                  {isSubmitting || isSubmittingForm ? (
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
                  {isSubmitting || isSubmittingForm
                    ? "作成中..."
                    : "予約を作成"}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
