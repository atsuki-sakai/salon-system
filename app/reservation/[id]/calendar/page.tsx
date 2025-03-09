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
  CardFooter,
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
  AlertCircle,
  Search,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
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
import { Phone, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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
  isActive?: boolean;
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

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
  hover: { y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" },
};

// スタイル定義（モバイル最適化）
const styles = {
  stepBadge: {
    default:
      "bg-gray-100 text-gray-600 border-gray-200 py-1 px-2 text-base font-semibold",
    active:
      "bg-yellow-100 text-yellow-700 border-yellow-300 py-1 px-2 text-base font-semibold",
    complete:
      "bg-green-100 text-green-700 border-green-300 py-1 px-2 text-base font-semibold",
    disabled:
      "bg-gray-100 text-gray-400 border-gray-200 py-1 px-2 text-base font-semibold opacity-60",
  },
  stepTitle: {
    default: "text-base font-medium text-gray-700",
    active: "text-base font-medium text-yellow-700",
    complete: "text-base font-medium text-green-700",
    disabled: "text-base font-medium text-gray-400",
  },
  sectionWrapper: {
    default:
      "space-y-4 p-4 sm:p-6 rounded-lg border bg-white transition-all duration-200",
    active:
      "space-y-4 p-4 sm:p-6 rounded-lg border-2 border-yellow-200 bg-yellow-50/30 shadow-sm transition-all duration-200",
    complete:
      "space-y-4 p-4 sm:p-6 rounded-lg border border-green-200 bg-green-50/20 transition-all duration-200",
    disabled:
      "space-y-4 p-4 sm:p-6 rounded-lg border border-gray-200 bg-gray-50/50 opacity-75 transition-all duration-200",
  },
  fieldWrapper: "space-y-3",
  timeButton: `
    h-auto py-2 px-3 sm:py-3 sm:px-4 flex flex-col items-start justify-center rounded-lg
    transition-all duration-200 hover:shadow-md border-2 w-full
  `,
  timeButtonSelected: "bg-slate-50 text-slate-800 border-slate-300 shadow-sm",
  timeButtonDefault:
    "bg-white text-gray-700 border-gray-200 hover:border-slate-200 hover:bg-gray-50",
  optionCard: {
    default:
      "border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-sm hover:border-slate-200",
    selected:
      "border-2 border-slate-300 bg-slate-50 shadow-md rounded-lg cursor-pointer transition-all duration-200 overflow-hidden",
  },
  badge: {
    count: "bg-white text-blue-600 border-blue-200",
    max: "text-xs bg-blue-50 border-blue-200 text-blue-700",
    sale: "bg-red-600 text-white tracking-wide font-bold",
    category: "bg-indigo-50 border-indigo-200 text-indigo-700 text-xs",
  },
  alertHeader:
    "bg-gradient-to-r from-slate-600 to-blue-700 p-4 sm:p-6 sticky top-0 z-10",
  progressSteps: 4,
  selectionCard: {
    default:
      "border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer hover:border-slate-200 flex flex-col h-full",
    selected:
      "border-2 border-slate-400 bg-slate-50/50 shadow-md rounded-lg transition-all duration-200 cursor-pointer flex flex-col h-full",
  },
  imageContainer:
    "relative w-full min-h-[140px] sm:min-h-[180px] aspect-video bg-gray-100 overflow-hidden rounded-t-lg",
  searchContainer: "relative flex items-center w-full",
  searchIcon:
    "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
  clearButton:
    "absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600",
  priceDisplay: {
    default: "text-sm font-semibold text-gray-800",
    sale: "text-sm font-bold text-red-600",
    lineThrough: "text-xs text-gray-400 line-through",
  },
  headerContainer: "sticky top-0 z-40 bg-white border-b shadow-sm",
  progressContainer:
    "bg-white/95 backdrop-blur-sm px-3 py-3 sm:px-6 sm:py-4 rounded-lg shadow-sm flex items-center justify-between",
  infoText: "text-xs text-gray-500",
  activeStep: "text-sm font-bold text-slate-700",
  bottomBar:
    "fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 w-full px-4 py-3",
  bottomBarContent:
    "w-full max-w-4xl mx-auto flex sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3",
  bottomBarBadges: "flex flex-wrap items-center gap-1 text-xs",
  selectionBadges: "overflow-x-auto flex flex-nowrap items-center gap-1 pb-1",
  carouselItem: "basis-1/2 md:basis-1/2 lg:basis-1/3  md:px-2",
  carouselNav: "absolute right-0 top-1/2 -translate-y-1/2 flex gap-1",
  carouselContainer: "relative",
  carouselCounter:
    "text-xs text-gray-500 absolute top-0 right-0 bg-white px-2 py-1 rounded-md shadow-sm",
};

// セクションコンポーネント（モバイル最適化）
const Section: React.FC<SectionProps> = ({
  badge,
  title,
  children,
  isComplete = false,
  isDisabled = false,
  icon,
  error,
  isOptional = false,
  isActive = false,
}) => {
  // セクションのスタイル決定ロジック
  const getSectionStyle = () => {
    if (isDisabled) return styles.sectionWrapper.disabled;
    if (isComplete) return styles.sectionWrapper.complete;
    if (isActive) return styles.sectionWrapper.active;
    return styles.sectionWrapper.default;
  };

  const getBadgeStyle = () => {
    if (isDisabled) return styles.stepBadge.disabled;
    if (isComplete) return styles.stepBadge.complete;
    if (isActive) return styles.stepBadge.active;
    return styles.stepBadge.default;
  };

  const getTitleStyle = () => {
    if (isDisabled) return styles.stepTitle.disabled;
    if (isComplete) return styles.stepTitle.complete;
    if (isActive) return styles.stepTitle.active;
    return styles.stepTitle.default;
  };

  return (
    <motion.div
      className={getSectionStyle()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getBadgeStyle()}>
          {badge}
        </Badge>
        <span className={getTitleStyle()}>{title}</span>
        {isOptional && (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-500 text-xs border-gray-200"
          >
            任意
          </Badge>
        )}
        {icon && (
          <span className={isActive ? "text-slate-500" : "text-gray-400"}>
            {icon}
          </span>
        )}
        {isComplete && (
          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-1 bg-red-50 p-2 rounded-md border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.fieldWrapper}>{children}</div>
    </motion.div>
  );
};

// 空の状態コンポーネント（モバイル最適化）
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  type = "info",
}) => {
  const getBgColor = () => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "warning":
        return "text-amber-800";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning":
        return "text-amber-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      className={`rounded-lg ${getBgColor()} p-4 sm:p-8 text-center ${getTextColor()} shadow-sm border`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`mx-auto mb-4 ${getIconColor()}`}>{icon}</div>
      <p className="text-base font-bold mb-2">{title}</p>
      <p className="text-sm mt-1 max-w-md mx-auto">{description}</p>
    </motion.div>
  );
};

// 予約確認ダイアログコンポーネント（モバイル最適化）
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
      <AlertDialogContent className="max-w-lg p-0 gap-0 rounded-xl overflow-hidden max-h-[95vh] w-[95vw] sm:w-auto">
        <AlertDialogHeader className={styles.alertHeader}>
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            予約内容の確認
          </AlertDialogTitle>
          <AlertDialogDescription className="text-indigo-100 text-sm">
            以下の内容で予約を確定しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[calc(95vh-11rem)]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* 予約日時情報 */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-4">
                <CardTitle className="text-sm sm:text-base text-slate-800">
                  予約日時
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 font-medium">
                      予約日
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-slate-600" />
                      {selectedTimeSlot
                        ? formatDateJP(selectedTimeSlot.date || "")
                        : ""}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 text-right font-medium">
                      予約時間
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                      <span className="text-base sm:text-lg font-bold text-slate-800 tracking-wide">
                        {selectedTimeSlot
                          ? `${selectedTimeSlot.startTime.split("T")[1]}〜${selectedTimeSlot.endTime.split("T")[1]}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2 sm:p-3 rounded-md border border-slate-200 flex items-start gap-2">
                  <InfoIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-slate-500 mt-0.5" />
                  <span>
                    開始時間の5分前にはお店にお越し頂けますと幸いです。
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 予約メニュー情報 */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-4">
                <CardTitle className="text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
                  予約メニュー
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">
                    {selectedMenuName}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs shrink-0 ml-1"
                  >
                    {selectedMenuDuration}分
                  </Badge>
                </div>
                <Separator className="my-2 sm:my-3" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    担当スタッフ
                  </div>
                  <span className="font-medium text-sm text-gray-800">
                    {selectedTimeSlot?.staffName}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 料金情報 */}
            <Card className="border-green-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-green-50 pb-2 pt-3 px-3 sm:pb-3 sm:pt-4 sm:px-4">
                <CardTitle className="text-sm sm:text-base text-green-800 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  料金内訳
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">
                      メニュー料金
                    </span>
                  </div>
                  {selectedMenu?.salePrice ? (
                    <div className="flex flex-col items-end">
                      <span className="line-through text-gray-400 text-xs">
                        ¥{selectedMenu?.price.toLocaleString()}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-600 border-red-200 font-medium text-xs"
                      >
                        ¥{selectedMenu?.salePrice.toLocaleString()}
                      </Badge>
                    </div>
                  ) : (
                    <span className="font-medium text-sm text-gray-800">
                      ¥{selectedMenu?.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {selectedStaff?.extraCharge ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">
                      指名料
                    </span>
                    <span className="font-medium text-sm text-gray-800">
                      ¥{selectedStaff?.extraCharge?.toLocaleString()}
                    </span>
                  </div>
                ) : null}

                {/* オプション料金（選択されている場合） */}
                {selectedOptions.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">
                          オプション料金
                        </span>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-xs">
                          {selectedOptions.length}個
                        </Badge>
                      </div>
                      <span className="font-medium text-sm text-gray-800">
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
                    <div className="bg-gray-50 rounded-md p-3 sm:p-4 space-y-1 sm:space-y-2 text-xs sm:text-sm border border-gray-100">
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
                            <span className="text-gray-600 line-clamp-1 mr-2">
                              ・{option.name}
                            </span>
                            <span className="font-medium whitespace-nowrap">
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

                <Separator className="my-1" />
                <div className="flex justify-between items-center pt-1 sm:pt-2">
                  <span className="font-bold text-sm sm:text-base text-gray-800">
                    合計金額
                  </span>
                  <div className="font-bold text-xl sm:text-2xl text-green-600">
                    ¥{calculateTotalPrice.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 備考欄 */}
            <div className="space-y-2 pb-2">
              <label
                htmlFor="notes"
                className="font-medium text-slate-800 text-xs sm:text-sm flex items-center gap-2"
              >
                <InfoIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                備考
              </label>
              <Textarea
                id="notes"
                rows={5}
                className="text-sm tracking-wide resize-none min-h-20 sm:min-h-28 border-2 focus:border-slate-300 rounded-lg"
                placeholder="特別なご要望がございましたらご記入ください"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="sticky bottom-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-t z-10 gap-2 sm:gap-3 shadow-md flex flex-col sm:flex-row">
          <AlertDialogAction
            className="shadow-lg gap-2 sm:flex-[2] bg-slate-800 hover:bg-slate-900"
            onClick={onConfirm}
          >
            <CheckCircle2 className="h-4 w-4" />
            予約を確定する
          </AlertDialogAction>
          <AlertDialogCancel className="mt-0 border border-gray-300 sm:flex-1 sm:max-w-[120px]">
            戻る
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// サロン情報モバイルサイドシート
const SalonInfoSheet: React.FC<{
  salonConfig: Doc<"salon_config"> | null;
}> = ({ salonConfig }) => {
  if (!salonConfig) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 px-2 gap-1 sm:hidden bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          <InfoIcon className="h-3 w-3" />
          サロン情報
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>サロン情報</SheetTitle>
          <SheetDescription>{salonConfig.salonName}の詳細情報</SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          {salonConfig?.imgFileId && (
            <div className="flex flex-col items-center">
              <div className="overflow-hidden shadow-sm mb-3 w-full max-w-[200px]">
                <FileImage
                  fileId={salonConfig.imgFileId}
                  alt={salonConfig.salonName}
                  size={300}
                  fullSize
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {salonConfig.salonName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {salonConfig.address}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                連絡先
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <a
                    className="text-indigo-600 hover:underline"
                    href={`tel:${salonConfig?.phone}`}
                  >
                    {salonConfig?.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <a
                    className="text-indigo-600 hover:underline"
                    href={`mailto:${salonConfig?.email}`}
                  >
                    {salonConfig?.email}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                営業情報
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <ClockIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-gray-800">
                      {salonConfig?.regularOpenTime} 〜{" "}
                      {salonConfig?.regularCloseTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      定休日
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {salonConfig?.regularHolidays
                        ?.slice(0, 6)
                        .map((holiday) => (
                          <Badge
                            key={holiday}
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-1"
                          >
                            {holiday}
                          </Badge>
                        ))}
                      <span className="text-xs text-gray-500">
                        直近の定休日を表示しています。
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {salonConfig?.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  サロン概要
                </h4>
                <p className="text-sm text-gray-600 tracking-wide leading-5">
                  {salonConfig.description}
                </p>
              </div>
            )}

            {salonConfig?.reservationRules && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  予約時の注意事項
                </h4>
                <p className="text-xs text-amber-700">
                  {salonConfig.reservationRules}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// カルーセルカウンターコンポーネント
const CarouselCounter = ({
  api,
  totalItems,
}: {
  api: CarouselApi | null;
  totalItems: number;
}) => {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border shadow-sm">
      {current} / {totalItems}
    </div>
  );
};

export default function ReservationTimePicker() {
  const { id } = useParams();
  const salonId = id as string;
  const router = useRouter();

  // カルーセルAPI状態
  const [menuCarouselApi, setMenuCarouselApi] = useState<CarouselApi | null>(
    null
  );
  const [staffCarouselApi, setStaffCarouselApi] = useState<CarouselApi | null>(
    null
  );

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
  const [sessionCustomer, setSessionCustomer] =
    useState<Doc<"customer"> | null>(null);
  const [availableStaffs, setAvailableStaffs] = useState<Doc<"staff">[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 検索フィルタリング用の状態
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>("");

  // メニューとスタッフの詳細表示制御
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
  const isStepFourComplete = !!selectedTimeSlot;

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

  // 進捗状況と現在のステップの更新
  useEffect(() => {
    let completedSteps = 0;
    let currentStepValue = 1;

    if (isStepOneComplete) {
      completedSteps++;
      currentStepValue = 2;
    }

    if (isStepTwoComplete) {
      completedSteps++;
      currentStepValue = 3;
    }

    if (isStepThreeComplete) {
      completedSteps++;
      currentStepValue = 4;
    }

    if (isStepFourComplete) {
      completedSteps++;
    }

    setProgress((completedSteps / styles.progressSteps) * 100);
    setCurrentStep(currentStepValue);
  }, [
    isStepOneComplete,
    isStepTwoComplete,
    isStepThreeComplete,
    isStepFourComplete,
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
    const customerData = getCookie("__salonapp_session");
    if (!salonId) return;

    if (customerData) {
      setSessionCustomer(JSON.parse(customerData));
    } else {
      router.push(`/reservation/${salonId}`);
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

  const handleConfirmReservation = async (): Promise<void> => {
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

      const reservationId = await createReservation({
        menuId: selectedMenuId,
        staffId: selectedStaffId,
        staffExtraCharge: selectedStaff?.extraCharge ?? 0,
        salonId: salonId,
        salonName: salonConfig?.salonName ?? "",
        reservationDate: dateString,
        startTime: fullStartTime,
        endTime: fullEndTime,
        menuName: selectedMenu?.name ?? "",
        price: selectedMenu?.price ?? 0,
        customerId: sessionCustomer?._id ?? "only-session",
        customerName: sessionCustomer?.firstName ?? "未設定",
        customerPhone: sessionCustomer?.phone ?? "未設定",
        status: "confirmed",
        notes: notes,
        staffName: selectedStaff?.name ?? "",
        selectedOptions: optionsToSave,
      });

      setDialogOpen(false);
      toast.success("予約が確定されました");
      router.push(
        `/reservation/${salonId}/calendar/complete?reservationId=${reservationId}`
      );
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
    { label: "予約者情報の設定", href: `/reservation/${salonId}` },
    { label: "予約内容を選択", href: `/reservation/${salonId}/calendar` },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-24">
      {/* ヘッダー（固定表示） */}
      <div className={styles.headerContainer}>
        <Card className="border-none shadow-md rounded-none">
          <CardHeader className="pt-3 pb-3 px-3 sm:pt-5 sm:pb-4 sm:px-6">
            <div className="mb-2 sm:mb-3 flex justify-between items-center">
              <div className="flex-1 overflow-hidden">
                <OriginalBreadcrumb items={breadcrumbItems} />
              </div>
              <SalonInfoSheet salonConfig={salonConfig!} />
            </div>

            <CardDescription className="text-gray-600">
              <div className="w-full space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className={styles.infoText}>予約の進捗状況</p>
                    <p className={styles.activeStep}>
                      {currentStep === 1 && "メニューを選択"}
                      {currentStep === 2 && "スタッフを指名"}
                      {currentStep === 3 && "日付とオプションを選択"}
                      {currentStep === 4 && "予約時間を選択"}
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="text-lg sm:text-xl font-bold text-slate-600">
                      {Math.round(progress)}%
                    </span>
                    <span className="text-xs text-gray-500 block">完了</span>
                  </p>
                </div>
                <Progress value={progress} className="h-1.5 sm:h-2" />
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="px-3 sm:px-4 mx-auto">
        {/* サロン情報カード（PCのみ表示） */}
        <Card className="mb-6 border-slate-100 overflow-hidden shadow-sm hidden sm:block">
          <CardHeader className="bg-gradient-to-r from-slate-50/60 to-blue-50/80 pt-4 pb-3">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              サロン情報
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-6">
              {salonConfig?.imgFileId ? (
                <div className="w-full md:w-1/3 flex flex-col items-center md:items-start">
                  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm mb-3 w-full max-w-[200px]">
                    <FileImage
                      fileId={salonConfig.imgFileId}
                      alt={salonConfig.salonName}
                      size={300}
                      fullSize
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {salonConfig.salonName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {salonConfig.address}
                  </p>
                </div>
              ) : null}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      連絡先
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <a
                          className="text-slate-600 hover:underline"
                          href={`tel:${salonConfig?.phone}`}
                        >
                          {salonConfig?.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <a
                          className="text-slate-600 hover:underline"
                          href={`mailto:${salonConfig?.email}`}
                        >
                          {salonConfig?.email}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      営業情報
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <ClockIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-gray-800">
                            {salonConfig?.regularOpenTime} 〜{" "}
                            {salonConfig?.regularCloseTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-gray-800">定休日</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {salonConfig?.regularHolidays
                              ?.slice(0, 6)
                              .map((holiday) => (
                                <Badge
                                  key={holiday}
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200 text-xs"
                                >
                                  {holiday}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {salonConfig?.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      サロン概要
                    </h4>
                    <p className="text-sm text-gray-600">
                      {salonConfig.description}
                    </p>
                  </div>
                )}

                {salonConfig?.reservationRules && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      予約時の注意事項
                    </h4>
                    <p className="text-xs text-amber-700">
                      {salonConfig.reservationRules}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 pt-4">
          {/* STEP 1: メニュー選択 */}
          <Section
            badge="STEP 1"
            title="メニューを選択"
            isComplete={isStepOneComplete}
            isActive={currentStep === 1}
            icon={<Scissors className="h-6 w-6" />}
          >
            <div className="space-y-4">
              {/* メニュー検索ボックス */}
              <div className={styles.searchContainer}>
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  placeholder="メニューを検索..."
                  className="pl-10 rounded-sm border focus:border-slate-300 text-sm tracking-wide"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                />
                {menuSearchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setMenuSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {filteredMenus.length > 0 ? (
                <div className={styles.carouselContainer}>
                  <Carousel
                    setApi={setMenuCarouselApi}
                    className="w-full"
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                  >
                    <CarouselContent>
                      {filteredMenus.map((menu) => (
                        <CarouselItem
                          key={menu._id}
                          className={styles.carouselItem}
                        >
                          <motion.div
                            variants={cardVariants}
                            whileHover="hover"
                            className="h-full"
                            animate={{ opacity: 1, y: 0 }}
                            initial={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card
                              className={cn(
                                selectedMenuId === menu._id
                                  ? styles.selectionCard.selected
                                  : styles.selectionCard.default
                              )}
                              onClick={() => handleMenuSelect(menu._id)}
                            >
                              {selectedMenuId === menu._id && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Badge className="bg-green-600 border-none text-xs">
                                    選択中
                                  </Badge>
                                </div>
                              )}
                              <div className={styles.imageContainer}>
                                {menu.imgFileId ? (
                                  <FileImage
                                    fileId={menu.imgFileId}
                                    alt={menu.name}
                                    size={300}
                                    fullSize
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Scissors className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
                                  <div className="flex items-center gap-1">
                                    <Badge className="bg-gray-50 text-gray-700 border-none text-xs">
                                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                      {menu.timeToMin}分
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <CardContent className="p-3 sm:p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">
                                  {menu.name}
                                </h3>

                                {menu.salePrice ? (
                                  <div className="flex items-baseline gap-1 sm:gap-2">
                                    <span
                                      className={
                                        styles.priceDisplay.lineThrough
                                      }
                                    >
                                      ¥{menu.price.toLocaleString()}
                                    </span>
                                    <span className={styles.priceDisplay.sale}>
                                      ¥{menu.salePrice.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={styles.priceDisplay.default}>
                                    ¥{menu.price.toLocaleString()}
                                  </span>
                                )}

                                {menu.description && (
                                  <Collapsible
                                    open={menuDetailOpen === menu._id}
                                    onOpenChange={(open: boolean) => {
                                      // イベントの伝播を防ぐ
                                      setMenuDetailOpen(open ? menu._id : null);
                                    }}
                                  >
                                    <CollapsibleTrigger
                                      onClick={(
                                        e: React.MouseEvent<HTMLButtonElement>
                                      ) => {
                                        e.stopPropagation();
                                      }}
                                      className="text-xs text-slate-600 mt-2 flex items-center hover:underline"
                                    >
                                      {menuDetailOpen === menu._id ? (
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                      )}
                                      詳細を
                                      {menuDetailOpen === menu._id
                                        ? "閉じる"
                                        : "見る"}
                                    </CollapsibleTrigger>
                                    <CollapsibleContent
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-2"
                                    >
                                      <p className="text-xs text-gray-600">
                                        {menu.description}
                                      </p>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <div className="flex items-center justify-center mt-2 gap-2">
                      <CarouselPrevious className="static transform-none mx-1" />
                      <div className="text-xs text-slate-500">
                        横にスワイプしてもっと見る
                      </div>
                      <CarouselNext className="static transform-none mx-1" />
                    </div>

                    <div className="absolute top-2 right-2">
                      <CarouselCounter
                        api={menuCarouselApi}
                        totalItems={Math.ceil(
                          filteredMenus.length /
                            (window.innerWidth < 768
                              ? 1
                              : window.innerWidth < 1024
                                ? 2
                                : 3)
                        )}
                      />
                    </div>
                  </Carousel>
                </div>
              ) : (
                <EmptyState
                  icon={<AlertCircle className="h-8 w-8 sm:h-10 sm:w-10" />}
                  title="条件に一致するメニューがありません"
                  description="検索条件を変更してお試しください"
                />
              )}
            </div>
          </Section>

          {/* STEP 2: スタッフ選択 */}
          <Section
            badge="STEP 2"
            title="スタッフを指名"
            isComplete={isStepTwoComplete}
            isDisabled={!isStepOneComplete}
            isActive={currentStep === 2}
            error={
              !isStepOneComplete ? "先にメニューを選択してください" : undefined
            }
            icon={<Users className="h-4 w-4" />}
          >
            {isStepOneComplete ? (
              <div className="space-y-4">
                {/* スタッフ検索フィールド */}
                <div className={styles.searchContainer}>
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    placeholder="スタッフを検索..."
                    className="pl-10 rounded-sm text-sm tracking-wide border focus:border-slate-300"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                  />
                  {staffSearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                      onClick={() => setStaffSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {filteredStaffs.length > 0 ? (
                  <div className={styles.carouselContainer}>
                    <Carousel
                      setApi={setStaffCarouselApi}
                      className="w-full"
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                    >
                      <CarouselContent>
                        {filteredStaffs.map((staff) => (
                          <CarouselItem
                            key={staff._id}
                            className={styles.carouselItem}
                          >
                            <motion.div
                              variants={cardVariants}
                              whileHover="hover"
                              className="h-full"
                              animate={{ opacity: 1, y: 0 }}
                              initial={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card
                                className={cn(
                                  selectedStaffId === staff._id
                                    ? styles.selectionCard.selected +
                                        " relative"
                                    : styles.selectionCard.default + " relative"
                                )}
                                onClick={() => handleStaffSelect(staff._id)}
                              >
                                {selectedStaffId === staff._id && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <Badge className="bg-slate-600 border-none text-xs">
                                      選択中
                                    </Badge>
                                  </div>
                                )}
                                <div className={styles.imageContainer}>
                                  {staff.imgFileId ? (
                                    <FileImage
                                      fileId={staff.imgFileId}
                                      alt={staff.name}
                                      size={300}
                                      fullSize
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                      <Users className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
                                    <div className="flex items-center gap-1">
                                      {staff.gender && (
                                        <Badge className="bg-white/90 text-gray-800 border-none text-xs">
                                          {staff.gender}
                                        </Badge>
                                      )}
                                      {staff.age && (
                                        <Badge className="bg-white/90 text-gray-800 border-none text-xs">
                                          {staff.age}歳
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <CardContent className="p-3 sm:p-4">
                                  <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                                    {staff.name}
                                  </h3>

                                  {staff.extraCharge ? (
                                    <div className="text-xs sm:text-sm text-gray-700">
                                      指名料:{" "}
                                      <span className="font-semibold">
                                        ¥{staff.extraCharge.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                                      指名料無料
                                    </span>
                                  )}

                                  {staff.description && (
                                    <Collapsible
                                      open={staffDetailOpen === staff._id}
                                      onOpenChange={(open: boolean) => {
                                        setStaffDetailOpen(
                                          open ? staff._id : null
                                        );
                                      }}
                                    >
                                      <CollapsibleTrigger
                                        onClick={(
                                          e: React.MouseEvent<HTMLButtonElement>
                                        ) => {
                                          e.stopPropagation();
                                        }}
                                        className="text-xs text-slate-600 mt-2 flex items-center hover:underline"
                                      >
                                        {staffDetailOpen === staff._id ? (
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 mr-1" />
                                        )}
                                        詳細を
                                        {staffDetailOpen === staff._id
                                          ? "閉じる"
                                          : "見る"}
                                      </CollapsibleTrigger>
                                      <CollapsibleContent
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-2"
                                      >
                                        <p className="text-xs text-gray-600 bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-100">
                                          {staff.description}
                                        </p>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      <div className="flex items-center justify-center mt-2 gap-2">
                        <CarouselPrevious className="static transform-none mx-1" />
                        <div className="text-xs text-slate-500">
                          横にスワイプしてもっと見る
                        </div>
                        <CarouselNext className="static transform-none mx-1" />
                      </div>

                      <div className="absolute top-2 right-2">
                        <CarouselCounter
                          api={staffCarouselApi}
                          totalItems={Math.ceil(
                            filteredStaffs.length /
                              (window.innerWidth < 768
                                ? 1
                                : window.innerWidth < 1024
                                  ? 2
                                  : 3)
                          )}
                        />
                      </div>
                    </Carousel>
                  </div>
                ) : (
                  <EmptyState
                    icon={<AlertCircle className="h-8 w-8 sm:h-10 sm:w-10" />}
                    title="このメニューを担当できるスタッフがいません"
                    description="別のメニューを選択してください"
                  />
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-8 w-8 sm:h-10 sm:w-10" />}
                title="メニューを選択してください"
                description="先にメニューを選択するとスタッフが表示されます"
                type="info"
              />
            )}
          </Section>

          {/* オプション選択（サイドバーに移動） */}
          <div>
            <Section
              badge="STEP 3-1"
              title="オプションを選択"
              isOptional={true}
              isActive={currentStep === 3 && isStepThreeComplete}
              icon={<Tag className="h-4 w-4" />}
            >
              {salonConfig?.options && salonConfig.options.length > 0 ? (
                <ScrollArea className="h-fit max-h-64">
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {salonConfig.options.map((option: MenuOption) => (
                      <motion.div
                        key={option.id}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        className="rounded-lg overflow-hidden"
                      >
                        <div
                          className={cn(
                            selectedOptions.includes(option.id)
                              ? styles.optionCard.selected
                              : styles.optionCard.default
                          )}
                          onClick={() => handleOptionChange(option.id)}
                        >
                          <div className="p-2 sm:p-3 flex items-center justify-between">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Checkbox
                                id={`option-${option.id}`}
                                checked={selectedOptions.includes(option.id)}
                                onCheckedChange={() =>
                                  handleOptionChange(option.id)
                                }
                                className="mt-1 data-[state=checked]:bg-slate-600"
                              />
                              <div className="space-y-0.5 sm:space-y-1">
                                <div className="flex items-center flex-wrap gap-1">
                                  <label
                                    htmlFor={`option-${option.id}`}
                                    className="font-medium text-gray-800 text-xs sm:text-sm line-clamp-2"
                                  >
                                    {option.name}
                                  </label>
                                  {option.maxCount && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                                          >
                                            最大{option.maxCount}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">
                                            このオプションは最大
                                            {option.maxCount}
                                            つまで選択できます
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                <div>
                                  {option.salePrice ? (
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="line-through text-gray-400 text-xs">
                                        ¥{option.price.toLocaleString()}
                                      </span>
                                      <p className="text-red-600 text-sm font-bold">
                                        ¥{option.salePrice.toLocaleString()}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-xs sm:text-sm font-medium">
                                      ¥{option.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </ScrollArea>
              ) : (
                <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">
                    オプションはありません
                  </p>
                </div>
              )}

              {/* 選択されたオプション表示 */}
              <AnimatePresence>
                {selectedOptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 sm:mt-4 overflow-hidden"
                  >
                    <Card className="bg-slate-50 border-slate-200">
                      <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm text-slate-800 flex items-center gap-1 sm:gap-2">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                          選択中のオプション
                          <Badge
                            variant="outline"
                            className="ml-auto bg-white text-slate-600 border-slate-200 text-xs"
                          >
                            {selectedOptions.length}個
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-1 sm:py-2 px-3 sm:px-4">
                        <ScrollArea className="max-h-24 sm:max-h-32">
                          <div className="space-y-1">
                            {selectedOptions.map((optionId) => {
                              const option = salonConfig?.options?.find(
                                (o: MenuOption) => o.id === optionId
                              );
                              if (!option) return null;
                              return (
                                <div
                                  key={optionId}
                                  className="flex items-center justify-between py-1"
                                >
                                  <span className="text-xs sm:text-sm text-slate-800 mr-2 flex-1 line-clamp-1">
                                    {option.name}
                                  </span>
                                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    <span className="text-xs font-medium text-slate-700">
                                      ¥
                                      {(
                                        option.salePrice || option.price
                                      ).toLocaleString()}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 text-slate-500 hover:text-red-500 hover:bg-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOptionChange(optionId);
                                      }}
                                    >
                                      <MinusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter className="pt-0 pb-2 sm:pb-3 px-3 sm:px-4">
                        <div className="ml-auto bg-white rounded-full px-3 py-1 border border-slate-200">
                          <span className="text-xs font-medium text-slate-800">
                            合計:
                          </span>{" "}
                          <span className="text-base sm:text-lg font-bold text-slate-700">
                            ¥{optionsTotal.toLocaleString()}
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          </div>

          {/* STEP 3: 日付選択と仕様選択 - モバイル対応レイアウト */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <Section
                badge="STEP 3"
                title="日付を選択"
                isComplete={isStepThreeComplete}
                isDisabled={!isStepTwoComplete}
                isActive={currentStep === 3}
                error={
                  !isStepTwoComplete
                    ? "先にスタッフを選択してください"
                    : undefined
                }
                icon={<CalendarIcon className="h-4 w-4" />}
              >
                <div className="space-y-3 sm:space-y-4">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-medium rounded-lg",
                          !selectedDate && "text-gray-500",
                          !isStepTwoComplete && "opacity-50 cursor-not-allowed",
                          "border-2 focus:border-slate-300 h-10 sm:h-11 text-sm"
                        )}
                        disabled={!isStepTwoComplete}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-600" />
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
                          const today = new Date(
                            new Date().setHours(0, 0, 0, 0)
                          );
                          const isPast = date < today;
                          const isHoliday = disableDates.some(
                            (disabledDate) =>
                              disabledDate.toDateString() ===
                              date.toDateString()
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
                              disabledDate.toDateString() ===
                              date.toDateString()
                          )
                      )
                      .slice(0, 6)
                      .map((date, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => setSelectedDate(date)}
                          disabled={!isStepTwoComplete}
                          className={cn(
                            "h-10 sm:h-12 font-medium rounded-lg border-2 text-sm",
                            selectedDate &&
                              format(selectedDate, "yyyy-MM-dd") ===
                                format(date, "yyyy-MM-dd")
                              ? "bg-slate-50 text-slate-800 border-slate-300"
                              : "bg-white text-gray-800 border-gray-200 hover:border-slate-200",
                            !isStepTwoComplete &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {format(date, "MM/dd（E）", { locale: ja })}
                        </Button>
                      ))}
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* STEP 4: 時間選択 */}
          <Section
            badge="STEP 4"
            title="予約時間を選択"
            isComplete={selectedTimeSlot !== null}
            isDisabled={!isStepThreeComplete}
            isActive={currentStep === 4}
            error={
              !isStepThreeComplete ? "先に日付を選択してください" : undefined
            }
            icon={<ClockIcon className="h-4 w-4" />}
          >
            {isStepOneComplete && isStepTwoComplete && isStepThreeComplete ? (
              availableSlots.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(groupedTimeSlots).map(([date, slots]) => (
                    <motion.div
                      key={date}
                      className="space-y-2 sm:space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                          {formatDateJP(date)}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {slots.map((slot, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full"
                          >
                            <Button
                              variant="outline"
                              onClick={() => handleTimeSlotSelection(slot)}
                              className={cn(
                                styles.timeButton,
                                selectedTimeSlot?.date === slot.date &&
                                  selectedTimeSlot?.startTime === slot.startTime
                                  ? styles.timeButtonSelected
                                  : styles.timeButtonDefault
                              )}
                            >
                              <div className="w-full">
                                <div className="flex justify-between items-center w-full mb-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200 text-xs"
                                  >
                                    {selectedMenuDuration}分
                                  </Badge>
                                </div>

                                <div className="text-center">
                                  <span className="text-base sm:text-lg font-bold tracking-wide block">
                                    {slot.startTime.split("T")[1]} 〜{" "}
                                    {slot.endTime.split("T")[1]}
                                  </span>
                                </div>

                                <div className="text-center mt-1">
                                  <p className="text-xs sm:text-sm font-medium line-clamp-1">
                                    {selectedMenuName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                                    {slot.staffName}
                                  </p>
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                                  {selectedMenu?.salePrice ? (
                                    <span className="font-bold text-red-600 text-sm sm:text-base">
                                      ¥{selectedMenu.salePrice.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-gray-800 text-sm sm:text-base">
                                      ¥{selectedMenu?.price.toLocaleString()}
                                    </span>
                                  )}

                                  {selectedStaff?.extraCharge ? (
                                    <span className="text-xs text-gray-500 ml-1">
                                      +¥
                                      {selectedStaff.extraCharge.toLocaleString()}
                                    </span>
                                  ) : null}
                                </div>
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
                  icon={<ClockIcon className="h-10 w-10 sm:h-12 sm:w-12" />}
                  title="利用可能な時間枠がありません"
                  description="別の日付や別のスタッフを選択してください"
                  type="warning"
                />
              )
            ) : (
              <EmptyState
                icon={<ClockIcon className="h-10 w-10 sm:h-12 sm:w-12" />}
                title="日付を選択してください"
                description="メニュー、スタッフ、日付をすべて選択すると予約可能な時間が表示されます"
                type="info"
              />
            )}
          </Section>
        </div>
      </div>

      {/* 選択内容の要約（合計金額表示など） - モバイル最適化 */}
      {isStepOneComplete && (
        <div className={styles.bottomBar}>
          <div className={styles.bottomBarContent}>
            <div className="flex-1">
              <h3 className="text-base font-bold tracking-wide whitespace-nowrap text-gray-700 mb-1">
                {selectedMenuName}
                {selectedDate && (
                  <span className="text-sm text-gray-500">
                    {" - "}
                    {format(selectedDate, "MM/dd", { locale: ja })}
                  </span>
                )}
              </h3>
              <div className={styles.selectionBadges}>
                {selectedStaff?.name && (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-xs text-gray-600 font-500 font-bold border-r border-gray-200 pr-2">
                      担当者
                    </span>
                    <p className="text-sm font-bold tracking-wide text-gray-700">
                      {selectedStaff.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3 sm:w-auto w-full ">
              <div className="text-right w-full">
                <p className="text-xs text-gray-500">合計金額</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  ¥{calculateTotalPrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}