"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  ReactNode,
  ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OriginalBreadcrumb, FileImage } from "@/components/common";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircle2,
  CreditCard,
  Users,
  CalendarCheck,
  Tag,
  InfoIcon,
  MinusCircle,
  Scissors,
  Sparkles,
  AlertCircle,
  Search,
  Clock,
  X,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Doc } from "@/convex/_generated/dataModel";
import { getCookie } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TimeSlot {
  date?: string;
  startTime: string;
  endTime: string;
  staffName: string;
  staffId: string;
}

interface MenuOption {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  maxCount?: number;
}

interface SectionProps {
  badge: string;
  title: string;
  children: ReactNode;
  isComplete?: boolean;
  isDisabled?: boolean;
  icon?: ReactElement;
  error?: string;
  isOptional?: boolean;
}

interface EmptyStateProps {
  icon: ReactElement;
  title: string;
  description: string;
  type?: "info" | "warning" | "error";
}

interface ReservationConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTimeSlot: TimeSlot | null;
  selectedMenuName?: string;
  selectedMenuDuration?: number;
  selectedStaff?: Doc<"staff"> | null;
  selectedMenu?: Doc<"menu"> | null;
  selectedOptions: string[];
  salonConfig: Doc<"salon_config"> | null;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  calculateTotalPrice: number;
  onConfirm: () => void;
  formatDateJP: (dateStr: string) => string;
}

// アニメーション定義
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

// 共通のスタイル定義
const styles = {
  stepBadge: "text-primary border-primary px-2 py-1",
  stepTitle: "text-sm tracking-wide font-medium",
  sectionWrapper: "space-y-4",
  fieldWrapper: "space-y-2",
  selectTrigger: "w-full border-2 border-primary-100 ring-offset-primary-100",
  cardHighlight:
    "border-none shadow-sm bg-gradient-to-br from-primary-50 to-blue-50",
  timeButton: `
    h-auto py-2 flex flex-col items-start justify-center text-sm 
    transition-all duration-200 hover:shadow-md rounded-lg
  `,
  timeButtonSelected:
    "bg-primary-50 text-primary-800 border-primary-200 shadow-sm",
  timeButtonDefault: "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
  optionCard:
    "border cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-sm",
  optionCardSelected: "border-primary-300 bg-primary-50 shadow-md",
  optionCardDefault: "hover:border-gray-300",
  badge: {
    count: "bg-white text-primary-600 border-primary-200",
    max: "text-xs bg-blue-50 border-blue-200 text-blue-700",
    sale: "bg-red-500",
  },
  alertHeader:
    "bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-t-lg p-6 sticky top-0 z-10",
  progressSteps: 4, // 全ステップ数
  selectionCard:
    "border transition-all duration-200 hover:shadow-md cursor-pointer h-full",
  selectionCardSelected:
    "border-primary-500 ring-2 ring-primary-200 bg-primary-50",
  selectionCardDefault: "border-gray-200 hover:border-primary-200",
  imageContainer:
    "relative w-full aspect-video bg-gray-100 overflow-hidden rounded-t-lg",
  categoryBadge: "absolute top-2 right-2 z-10",
};

// セクションコンポーネント
const Section: React.FC<SectionProps> = ({
  badge,
  title,
  children,
  isComplete = false,
  isDisabled = false,
  icon,
  error,
  isOptional = false,
}) => {
  return (
    <div className={styles.sectionWrapper}>
      <div className="flex items-center gap-2 text-slate-800 font-medium">
        <Badge
          variant="outline"
          className={cn(styles.stepBadge, isDisabled && "opacity-50")}
        >
          {badge}
        </Badge>
        <span className={styles.stepTitle}>{title}</span>
        {isOptional && (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-600 text-xs"
          >
            任意
          </Badge>
        )}
        {isComplete && (
          <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
        )}
        {icon && <span className="ml-1 text-gray-500">{icon}</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <div className={styles.fieldWrapper}>{children}</div>
    </div>
  );
};

// 空の状態コンポーネント
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  type = "info",
}) => {
  const bgColor =
    type === "warning"
      ? "bg-amber-50"
      : type === "error"
        ? "bg-red-50"
        : "bg-gray-50";
  const textColor =
    type === "warning"
      ? "text-amber-800"
      : type === "error"
        ? "text-red-600"
        : "text-gray-600";

  return (
    <motion.div
      className={`rounded-lg ${bgColor} p-6 text-center ${textColor} shadow-sm`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto mb-4">{icon}</div>
      <p className="text-base font-bold">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </motion.div>
  );
};

// 予約確認ダイアログコンポーネント
const ReservationConfirmationDialog: React.FC<
  ReservationConfirmationDialogProps
> = ({
  open,
  onOpenChange,
  selectedTimeSlot,
  selectedMenuName,
  selectedMenuDuration,
  selectedStaff,
  selectedMenu,
  selectedOptions,
  salonConfig,
  notes,
  setNotes,
  calculateTotalPrice,
  onConfirm,
  formatDateJP,
}) => {
  if (!selectedTimeSlot) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] max-w-md overflow-hidden p-0 gap-0">
        <AlertDialogHeader className={styles.alertHeader}>
          <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            予約内容の確認
          </AlertDialogTitle>
          <AlertDialogDescription className="text-indigo-100">
            以下の内容で予約を確定しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          <div className="space-y-5">
            {/* 予約日時情報 */}
            <Card className={styles.cardHighlight}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">予約日</div>
                    <h3 className="text-lg font-bold text-primary-800 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-primary-600" />
                      {selectedTimeSlot
                        ? formatDateJP(selectedTimeSlot.date || "")
                        : ""}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 text-right">
                      予約時間
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-primary-600" />
                      <span className="text-lg font-bold text-primary-800 tracking-wide">
                        {selectedTimeSlot
                          ? `${selectedTimeSlot.startTime.split("T")[1]}〜${selectedTimeSlot.endTime.split("T")[1]}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded-md border border-primary-100">
                  <InfoIcon className="h-3 w-3 inline-block mr-1 text-primary-400" />
                  開始時間の5分前にはお店にお越し頂けますと幸いです。
                </div>
              </CardContent>
            </Card>

            {/* 予約メニュー情報 */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-gray-600" />
                  予約メニュー
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center my-2">
                  <span className="text-lg font-semibold text-gray-800">
                    {selectedMenuName}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary-50 text-primary-700"
                  >
                    {selectedMenuDuration}分
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    担当スタッフ
                  </div>
                  <span className="font-medium text-gray-800">
                    {selectedTimeSlot?.staffName}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 料金情報 */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  料金
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">メニュー料金</span>
                  </div>
                  {selectedMenu?.salePrice ? (
                    <div className="flex flex-col items-end">
                      <span className="line-through text-gray-400 text-xs">
                        ¥{selectedMenu?.price.toLocaleString()}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-600 border-red-200"
                      >
                        ¥{selectedMenu?.salePrice.toLocaleString()}
                      </Badge>
                    </div>
                  ) : (
                    <span className="font-medium">
                      ¥{selectedMenu?.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {selectedStaff?.extraCharge ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">指名料</span>
                    <span className="font-medium">
                      ¥{selectedStaff?.extraCharge?.toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {/* オプション料金（選択されている場合） */}
                {selectedOptions.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          オプション料金
                        </span>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {selectedOptions.length}個
                        </Badge>
                      </div>
                      <span className="font-medium">
                        ¥
                        {(salonConfig?.options || [])
                          .filter((option: MenuOption) =>
                            selectedOptions.includes(option.id)
                          )
                          .reduce(
                            (sum: number, option: MenuOption) =>
                              sum + (option.salePrice || option.price),
                            0
                          )
                          .toLocaleString()}
                      </span>
                    </div>

                    {/* オプション詳細リスト */}
                    <div className="bg-gray-50 rounded-md p-3 space-y-2 text-sm">
                      {selectedOptions.map((optionId) => {
                        const option = salonConfig?.options?.find(
                          (o: MenuOption) => o.id === optionId
                        );
                        if (!option) return null;
                        return (
                          <div
                            key={optionId}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-600">
                              ・{option.name}
                            </span>
                            <span className="font-medium">
                              ¥
                              {(
                                option.salePrice || option.price
                              ).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-800">合計</span>
                  <div className="font-bold text-2xl text-green-600">
                    ¥{calculateTotalPrice.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 備考欄 */}
            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="font-medium text-slate-800 text-sm flex items-center gap-2"
              >
                <InfoIcon className="h-4 w-4 text-gray-600" />
                備考
              </label>
              <Textarea
                id="notes"
                className="text-sm tracking-wide resize-none min-h-24 border-2 focus:border-primary-300"
                placeholder="特別なご要望がございましたらご記入ください"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="sticky bottom-0 px-6 py-4 border-t bg-white z-10 gap-3">
          <AlertDialogCancel className="mt-0 border-2 border-gray-300">
            戻る
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white shadow-lg"
            onClick={onConfirm}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            予約を確定する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function ReservationTimePicker() {
  const { id } = useParams();
  const salonId = id as string;
  const router = useRouter();

  // 状態変数の設定
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [disableDates, setDisableDates] = useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loginCustomer, setLoginCustomer] = useState<Doc<"customer"> | null>(
    null
  );
  const [availableStaffs, setAvailableStaffs] = useState<Doc<"staff">[]>([]);
  const [progress, setProgress] = useState<number>(0);

  // 検索フィルタリング用の状態
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>("");
  // メニューカテゴリーのタブ
  const [menuDetailOpen, setMenuDetailOpen] = useState<string | null>(null);
  const [staffDetailOpen, setStaffDetailOpen] = useState<string | null>(null);

  // 日付文字列（YYYY-MM-DD形式）
  const dateString = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;

  // データ取得
  const menus = useQuery(api.menu.getMenusBySalonId, { salonId });
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });
  const salonConfig = useQuery(api.salon_config.getSalonConfig, { salonId });
  const optimalTimeSlots = useQuery(
    api.reservation.findOptimalTimeSlots,
    selectedMenuId && selectedStaffId && dateString
      ? {
          menuId: selectedMenuId as Id<"menu">,
          salonId,
          staffId: selectedStaffId as Id<"staff">,
          date: dateString,
        }
      : "skip"
  );

  // フィルタリングされたメニュー一覧
  const filteredMenus = useMemo(() => {
    if (!menus) return [];

    return menus.filter((menu) => {
      const matchesSearch =
        menu.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
        (menu.description || "")
          .toLowerCase()
          .includes(menuSearchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [menus, menuSearchQuery]);

  // フィルタリングされたスタッフ一覧
  const filteredStaffs = useMemo(() => {
    if (!availableStaffs) return [];

    return availableStaffs.filter(
      (staff) =>
        staff.name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (staff.description || "")
          .toLowerCase()
          .includes(staffSearchQuery.toLowerCase())
    );
  }, [availableStaffs, staffSearchQuery]);

  // 予約作成ミューテーション
  const createReservation = useMutation(api.reservation.add);

  // 選択された情報を取得
  const selectedStaff = useMemo(
    () => staffs?.find((staff) => staff._id === selectedStaffId),
    [staffs, selectedStaffId]
  );

  const selectedMenu = useMemo(
    () => menus?.find((menu) => menu._id === selectedMenuId),
    [menus, selectedMenuId]
  );

  const selectedMenuName = useMemo(() => selectedMenu?.name, [selectedMenu]);

  const selectedMenuDuration = useMemo(
    () => selectedMenu?.timeToMin,
    [selectedMenu]
  );

  // 今後14日間の日付配列
  const nextTwoWeeks = useMemo(
    () => [...Array(14)].map((_, i) => addDays(new Date(), i)),
    []
  );

  // ステップの完了状態
  const isStepOneComplete = !!selectedMenuId;
  const isStepTwoComplete = !!selectedStaffId;
  const isStepThreeComplete = !!selectedDate;

  // 有効な時間枠を日付ごとにグループ化
  const groupedTimeSlots: Record<string, TimeSlot[]> = useMemo(() => {
    const grouped: Record<string, TimeSlot[]> = {};
    availableSlots.forEach((slot) => {
      if (slot.date && typeof slot.date === "string") {
        grouped[slot.date] = grouped[slot.date] || [];
        grouped[slot.date]?.push(slot);
      }
    });
    return grouped;
  }, [availableSlots]);

  // 合計金額の計算
  const calculateTotalPrice: number = useMemo(() => {
    if (!selectedMenu) return 0;

    const menuPrice = selectedMenu.salePrice
      ? selectedMenu.salePrice
      : selectedMenu.price;
    const extraCharge = selectedStaff?.extraCharge || 0;
    const optionsPrice = (salonConfig?.options || []).reduce(
      (sum: number, option: MenuOption) => {
        if (selectedOptions.includes(option.id)) {
          const price = option.salePrice ? option.salePrice : option.price;
          return sum + price;
        }
        return sum;
      },
      0
    );

    return menuPrice + extraCharge + optionsPrice;
  }, [selectedMenu, selectedStaff, selectedOptions, salonConfig]);

  // オプション合計金額
  const optionsTotal = useMemo(
    () =>
      (salonConfig?.options || [])
        .filter((option: MenuOption) => selectedOptions.includes(option.id))
        .reduce(
          (sum: number, option: MenuOption) =>
            sum + (option.salePrice || option.price),
          0
        ),
    [salonConfig, selectedOptions]
  );

  // 進捗状況の更新
  useEffect(() => {
    let progress = 0;
    if (isStepOneComplete) progress++;
    if (isStepTwoComplete) progress++;
    if (isStepThreeComplete) progress++;
    if (selectedTimeSlot) progress++;

    setProgress((progress / styles.progressSteps) * 100);
  }, [
    isStepOneComplete,
    isStepTwoComplete,
    isStepThreeComplete,
    selectedTimeSlot,
  ]);

  // 休日設定の読み込み
  useEffect(() => {
    const staffHolidays =
      selectedStaff?.regularHolidays?.map(
        (dateStr: string) => new Date(dateStr)
      ) || [];
    const salonHolidays =
      salonConfig?.regularHolidays?.map(
        (dateStr: string) => new Date(dateStr)
      ) || [];
    setDisableDates([...staffHolidays, ...salonHolidays]);
  }, [selectedStaff, salonConfig]);

  // 選択リセット処理
  useEffect(() => {
    setSelectedTimeSlot(null);
    setDialogOpen(false);
  }, [selectedMenuId, selectedStaffId, selectedDate]);

  // タイムスロットデータの更新
  useEffect(() => {
    const computedQuery = optimalTimeSlots || {
      success: false,
      availableSlots: [],
    };
    const newSlots =
      computedQuery && computedQuery.success
        ? computedQuery.availableSlots || []
        : [];

    if (JSON.stringify(newSlots) !== JSON.stringify(availableSlots)) {
      setAvailableSlots(newSlots);
    }
  }, [optimalTimeSlots, availableSlots]);

  // ユーザーログイン情報の確認
  useEffect(() => {
    const customerData = getCookie("salonapp-customer-cookie");
    if (!salonId) return;

    if (customerData) {
      setLoginCustomer(JSON.parse(customerData));
    } else {
      router.push(`/reserve/${salonId}`);
    }
  }, [router, salonId]);

  // 選択可能スタッフのフィルタリング
  useEffect(() => {
    if (selectedMenu && staffs) {
      const filteredStaffs = staffs.filter((staff) =>
        selectedMenu.availableStaffIds.includes(staff._id)
      );
      setAvailableStaffs(filteredStaffs);

      // メニュー変更時にスタッフ検索をリセット
      setStaffSearchQuery("");
    } else {
      setAvailableStaffs([]);
    }
  }, [selectedMenu, staffs]);

  // イベントハンドラー
  const handleDateSelect = (date: Date | undefined): void => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const handleTimeSlotSelection = (slot: TimeSlot): void => {
    setSelectedTimeSlot(slot);
    setDialogOpen(true);
  };

  const handleOptionChange = (optionId: string): void => {
    const isSelected = selectedOptions.includes(optionId);
    // 最大数のチェック
    const option = salonConfig?.options?.find(
      (opt: MenuOption) => opt.id === optionId
    );

    if (!isSelected && option?.maxCount) {
      const sameOptionCount = selectedOptions.filter((id) => {
        const opt = salonConfig?.options?.find((o: MenuOption) => o.id === id);
        return opt?.name === option.name;
      }).length;

      if (sameOptionCount >= option.maxCount) {
        toast.warning(
          `${option.name}は最大${option.maxCount}個までしか選択できません`
        );
        return;
      }
    }

    if (isSelected) {
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    } else {
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };

  const handleMenuSelect = (menuId: string): void => {
    setSelectedMenuId(menuId);
    // メニューが変わったらスタッフ選択をリセット
    setSelectedStaffId("");
    setMenuDetailOpen(null);
  };

  const handleStaffSelect = (staffId: string): void => {
    setSelectedStaffId(staffId);
    setStaffDetailOpen(null);
  };

  const handleConfirmReservation = (): void => {
    try {
      if (!selectedDate || !selectedTimeSlot) {
        toast.error("日付または時間が選択されていません");
        return;
      }

      const dateString = format(selectedDate, "yyyy-MM-dd");
      let startTimeStr = selectedTimeSlot.startTime;
      let endTimeStr = selectedTimeSlot.endTime;

      if (startTimeStr.includes("T")) {
        startTimeStr = startTimeStr.split("T")[1]!;
      }
      if (endTimeStr.includes("T")) {
        endTimeStr = endTimeStr.split("T")[1]!;
      }

      const fullStartTime = `${dateString}T${startTimeStr}`;
      const fullEndTime = `${dateString}T${endTimeStr}`;

      // 選択されたオプションの取得
      const optionsToSave = (salonConfig?.options || []).filter(
        (option: MenuOption) => selectedOptions.includes(option.id)
      );

      createReservation({
        menuId: selectedMenuId,
        staffId: selectedStaffId,
        salonId: salonId,
        reservationDate: dateString,
        startTime: fullStartTime,
        endTime: fullEndTime,
        menuName: selectedMenu?.name ?? "",
        price: selectedMenu?.price ?? 0,
        customerId: loginCustomer?._id ?? "only-session",
        customerName: loginCustomer?.firstName ?? "未設定",
        customerPhone: loginCustomer?.phone ?? "未設定",
        status: "confirmed",
        notes: notes,
        staffName: selectedStaff?.name ?? "",
        selectedOptions: optionsToSave,
      });

      setDialogOpen(false);
      toast.success("予約が確定されました");
      router.push(`/reserve/${salonId}/calendar/complete`);
    } catch (error) {
      console.error("予約エラー:", error);
      toast.error("予約に失敗しました");
    }
  };

  // 日付フォーマット関数
  const formatDateJP = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, "M月d日（E）", { locale: ja });
  };

  // パンくずリスト設定
  const breadcrumbItems = [
    { label: "予約者情報の設定", href: `/reserve/${salonId}` },
    { label: "予約時間を選択", href: `/reserve/${salonId}/calendar` },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-none shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
          <div className="mb-3">
            <OriginalBreadcrumb items={breadcrumbItems} />
          </div>
          <CardTitle className="text-xl font-bold text-start tracking-wide text-slate-800">
            予約時間を選択
          </CardTitle>
          <CardDescription className="text-gray-600">
            {salonConfig?.reservationRules}
          </CardDescription>
          <Progress value={progress} className="h-1.5 mt-4" />
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* STEP 1: メニュー選択 - 視覚的に強化 */}
            <Section
              badge="STEP 1"
              title="メニューを選択"
              isComplete={isStepOneComplete}
              icon={<Scissors className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* メニュー検索ボックス */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="メニューを検索..."
                      className="pl-9"
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                    />
                    {menuSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1.5 h-7 w-7"
                        onClick={() => setMenuSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {filteredMenus.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {filteredMenus.map((menu) => (
                      <motion.div
                        key={menu._id}
                        variants={cardVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            styles.selectionCard,
                            selectedMenuId === menu._id
                              ? styles.selectionCardSelected
                              : styles.selectionCardDefault
                          )}
                          onClick={() => handleMenuSelect(menu._id)}
                        >
                          <div className={styles.imageContainer}>
                            {menu.imgFileId ? (
                              <FileImage
                                fileId={menu.imgFileId}
                                alt={menu.name}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Scissors className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 line-clamp-1">
                                {menu.name}
                              </h3>
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-600">
                                  {menu.timeToMin}分
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {menu.salePrice ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="line-through text-xs text-gray-400">
                                      ¥{menu.price.toLocaleString()}
                                    </span>
                                    <span className="font-bold text-red-600">
                                      ¥{menu.salePrice.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-gray-800">
                                    ¥{menu.price.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {selectedMenuId === menu._id && (
                                <Badge className="bg-primary-500 text-white">
                                  選択中
                                </Badge>
                              )}
                            </div>

                            {/* メニュー詳細を開くボタン */}
                            {menu.description && (
                              <Collapsible
                                open={menuDetailOpen === menu._id}
                                onOpenChange={(open: boolean) => {
                                  setMenuDetailOpen(open ? menu._id : null);
                                }}
                              >
                                <CollapsibleTrigger
                                  onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>
                                  ) => {
                                    e.stopPropagation();
                                  }}
                                  className="text-xs text-primary-600 mt-2 flex items-center hover:underline"
                                >
                                  詳細を
                                  {menuDetailOpen === menu._id
                                    ? "閉じる"
                                    : "見る"}
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <p className="text-xs text-gray-600 mt-2">
                                    {menu.description}
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      条件に一致するメニューがありません
                    </p>
                  </div>
                )}
              </div>
            </Section>

            <Separator />

            {/* STEP 2: スタッフ選択 - 視覚的に強化 */}
            <Section
              badge="STEP 2"
              title="スタッフを指名"
              isComplete={isStepTwoComplete}
              isDisabled={!isStepOneComplete}
              error={
                !isStepOneComplete
                  ? "先にメニューを選択してください"
                  : undefined
              }
              icon={<Users className="h-4 w-4" />}
            >
              {isStepOneComplete ? (
                <div className="space-y-4">
                  {/* スタッフ検索フィールド */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="スタッフを検索..."
                      className="pl-9"
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      disabled={!isStepOneComplete}
                    />
                    {staffSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1.5 h-7 w-7"
                        onClick={() => setStaffSearchQuery("")}
                        disabled={!isStepOneComplete}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {filteredStaffs.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {filteredStaffs.map((staff) => (
                        <motion.div
                          key={staff._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={cn(
                              styles.selectionCard,
                              selectedStaffId === staff._id
                                ? styles.selectionCardSelected
                                : styles.selectionCardDefault
                            )}
                            onClick={() => handleStaffSelect(staff._id)}
                          >
                            <div className={styles.imageContainer}>
                              {staff.imgFileId ? (
                                <FileImage
                                  fileId={staff.imgFileId}
                                  alt={staff.name}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <Users className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              {staff.gender && (
                                <Badge
                                  variant="outline"
                                  className={`${styles.categoryBadge} bg-white`}
                                >
                                  {staff.gender}
                                </Badge>
                              )}
                            </div>

                            <CardContent className="p-3">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 line-clamp-1">
                                  {staff.name}
                                </h3>
                                {staff.age && (
                                  <span className="text-xs text-gray-600">
                                    {staff.age}歳
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {staff.extraCharge ? (
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xs text-gray-600">
                                        指名料:
                                      </span>
                                      <span className="font-bold text-gray-800">
                                        ¥{staff.extraCharge.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-green-600 font-medium">
                                      指名料無料
                                    </span>
                                  )}
                                </div>

                                {selectedStaffId === staff._id && (
                                  <Badge className="bg-primary-500 text-white">
                                    選択中
                                  </Badge>
                                )}
                              </div>

                              {/* スタッフ詳細を開くボタン */}
                              {staff.description && (
                                <Collapsible
                                  open={staffDetailOpen === staff._id}
                                  onOpenChange={(open: boolean) => {
                                    setStaffDetailOpen(open ? staff._id : null);
                                  }}
                                >
                                  <CollapsibleTrigger
                                    onClick={(
                                      e: React.MouseEvent<HTMLButtonElement>
                                    ) => {
                                      e.stopPropagation();
                                    }}
                                    className="text-xs text-primary-600 mt-2 flex items-center hover:underline"
                                  >
                                    詳細を
                                    {staffDetailOpen === staff._id
                                      ? "閉じる"
                                      : "見る"}
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <p className="text-xs text-gray-600 mt-2">
                                      {staff.description}
                                    </p>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        このメニューを担当できるスタッフがいません
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    先にメニューを選択してください
                  </p>
                </div>
              )}
            </Section>

            <Separator />

            {/* STEP 3: 日付選択 */}
            <Section
              badge="STEP 3"
              title="日付を選択"
              isComplete={isStepThreeComplete}
              isDisabled={!isStepTwoComplete}
              error={
                !isStepTwoComplete || !isStepOneComplete
                  ? "先にメニューとスタッフを選択してください"
                  : undefined
              }
              icon={<CalendarIcon className="h-4 w-4" />}
            >
              <div className="flex flex-col space-y-4">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm tracking-wider border-2 border-primary-100",
                        !selectedDate && "text-gray-500",
                        !isStepTwoComplete && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isStepTwoComplete}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary-600" />
                      {selectedDate
                        ? format(selectedDate, "yyyy年MM月dd日（E）", {
                            locale: ja,
                          })
                        : "日付を選択してください"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const isPast = date < today;
                        const isHoliday = disableDates.some(
                          (disabledDate) =>
                            disabledDate.toDateString() === date.toDateString()
                        );
                        return isPast || isHoliday;
                      }}
                      locale={ja}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {nextTwoWeeks
                    .filter(
                      (date) =>
                        !disableDates.some(
                          (disabledDate) =>
                            disabledDate.toDateString() === date.toDateString()
                        )
                    )
                    .slice(0, 6)
                    .map((date, index) => (
                      <Button
                        key={index}
                        variant={"outline"}
                        size="sm"
                        onClick={() => setSelectedDate(date)}
                        disabled={!isStepTwoComplete}
                        className={cn(
                          "relative text-sm h-10",
                          selectedDate &&
                            format(selectedDate, "yyyy-MM-dd") ===
                              format(date, "yyyy-MM-dd")
                            ? "bg-primary-50 text-primary-800 border-primary-200 font-medium"
                            : "bg-white text-gray-800 border-gray-200",
                          !isStepTwoComplete && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {format(date, "MM/dd（E）", { locale: ja })}
                      </Button>
                    ))}
                </div>
              </div>
            </Section>

            {/* STEP 3-1: オプション選択 */}
            <Separator />
            <Section
              badge="STEP 3-1"
              title="オプションを選択"
              isOptional={true}
              icon={<Tag className="h-4 w-4" />}
            >
              {salonConfig?.options && salonConfig.options.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {salonConfig.options.map((option: MenuOption) => (
                    <motion.div
                      key={option.id}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Card
                        className={cn(
                          styles.optionCard,
                          selectedOptions.includes(option.id)
                            ? styles.optionCardSelected
                            : styles.optionCardDefault
                        )}
                        onClick={() => handleOptionChange(option.id)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`option-${option.id}`}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={() =>
                                handleOptionChange(option.id)
                              }
                              className="mt-1 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white"
                            />
                            <div className="space-y-1">
                              <label
                                htmlFor={`option-${option.id}`}
                                className="font-medium text-gray-800 flex items-center gap-2"
                              >
                                {option.name}
                                {option.maxCount && (
                                  <Badge
                                    variant="outline"
                                    className={styles.badge.max}
                                  >
                                    最大{option.maxCount}個
                                  </Badge>
                                )}
                              </label>
                              <div className="flex items-center gap-2">
                                {option.salePrice ? (
                                  <>
                                    <span className="line-through text-gray-400 text-xs">
                                      ¥{option.price.toLocaleString()}
                                    </span>
                                    <Badge className={styles.badge.sale}>
                                      <Sparkles className="h-3 w-3 mr-1" />¥
                                      {option.salePrice.toLocaleString()}
                                    </Badge>
                                  </>
                                ) : (
                                  <span className="font-medium">
                                    ¥{option.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* オプションのアイコン表示 */}
                          {selectedOptions.includes(option.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-primary-600" />
                          ) : (
                            <Tag className="h-5 w-5 text-gray-400" />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Tag className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">
                      オプションは設定されていません
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 選択されたオプションの表示 */}
              <AnimatePresence>
                {selectedOptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4"
                  >
                    <Card className="bg-primary-50 border-primary-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-800">
                              選択中のオプション
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={styles.badge.count}
                          >
                            {selectedOptions.length}個選択中
                          </Badge>
                        </div>
                        <Separator className="my-3 bg-primary-200/50" />
                        <ScrollArea className="max-h-36">
                          <div className="flex flex-wrap gap-2">
                            {selectedOptions.map((optionId) => {
                              const option = salonConfig?.options?.find(
                                (o: MenuOption) => o.id === optionId
                              );
                              if (!option) return null;
                              return (
                                <Badge
                                  key={optionId}
                                  variant="secondary"
                                  className="py-1 px-3 bg-white border border-primary-200 text-primary-700 flex items-center gap-1"
                                >
                                  {option.name}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 rounded-full p-0 text-primary-500 hover:text-red-500 hover:bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOptionChange(optionId);
                                    }}
                                  >
                                    <MinusCircle className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                        </ScrollArea>

                        {/* オプション合計金額 */}
                        <div className="mt-3 flex justify-end">
                          <div className="bg-white rounded-full px-4 py-1 border border-primary-200 text-sm font-medium">
                            オプション合計: ¥{optionsTotal.toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>

            <Separator />

            {/* STEP 4: 時間選択 */}
            <Section
              badge="STEP 4"
              title="時間を選択"
              isComplete={selectedTimeSlot !== null}
              icon={<ClockIcon className="h-4 w-4" />}
            >
              {isStepOneComplete && isStepTwoComplete && isStepThreeComplete ? (
                availableSlots.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                      <motion.div
                        key={date}
                        className="space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary-600" />
                          <h3 className="font-bold text-lg text-gray-700">
                            {formatDateJP(date)}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {slots.map((slot, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                variant={"outline"}
                                onClick={() => handleTimeSlotSelection(slot)}
                                className={cn(
                                  styles.timeButton,
                                  selectedTimeSlot?.date === slot.date &&
                                    selectedTimeSlot?.startTime ===
                                      slot.startTime
                                    ? styles.timeButtonSelected
                                    : styles.timeButtonDefault
                                )}
                              >
                                <div className="w-full flex flex-col">
                                  <div className="flex justify-between items-center w-full">
                                    <p className="text-xs tracking-wide text-gray-500">
                                      {format(new Date(slot.date!), "M月dd日", {
                                        locale: ja,
                                      })}
                                      {" - "}
                                      {slot.staffName}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="bg-primary-50 text-primary-600 text-xs"
                                    >
                                      {selectedMenuDuration}分
                                    </Badge>
                                  </div>

                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-base font-medium text-primary-700 tracking-wide">
                                      {slot.startTime.split("T")[1]}〜
                                      {slot.endTime.split("T")[1]}
                                    </span>

                                    <div className="flex items-center gap-1 text-sm">
                                      {selectedMenu?.salePrice ? (
                                        <span className="text-green-600 font-bold">
                                          ¥
                                          {selectedMenu.salePrice.toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-green-600 font-bold">
                                          ¥
                                          {selectedMenu?.price.toLocaleString()}
                                        </span>
                                      )}

                                      {selectedStaff?.extraCharge ? (
                                        <span className="text-xs text-gray-500">
                                          +¥
                                          {selectedStaff.extraCharge.toLocaleString()}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <span className="text-sm font-bold mt-1 text-gray-800">
                                    {selectedMenuName}
                                  </span>
                                </div>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<ClockIcon className="h-12 w-12 text-gray-400" />}
                    title="利用可能な時間枠が見つかりません"
                    description="スタッフや日付を変更して再度ご確認ください"
                    type="warning"
                  />
                )
              ) : (
                <EmptyState
                  icon={<ClockIcon className="h-12 w-12 text-gray-400" />}
                  title="必要情報を入力してください"
                  description="メニュー、スタッフ、日付をすべて選択すると利用可能な時間枠が表示されます"
                  type="info"
                />
              )}
            </Section>
          </div>
        </CardContent>

        {/* 予約確認ダイアログ */}
        <ReservationConfirmationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedTimeSlot={selectedTimeSlot}
          selectedMenuName={selectedMenuName}
          selectedMenuDuration={selectedMenuDuration}
          selectedStaff={selectedStaff}
          selectedMenu={selectedMenu}
          selectedOptions={selectedOptions}
          salonConfig={salonConfig ?? null}
          notes={notes}
          setNotes={setNotes}
          calculateTotalPrice={calculateTotalPrice}
          onConfirm={handleConfirmReservation}
          formatDateJP={formatDateJP}
        />
      </Card>
    </div>
  );
}