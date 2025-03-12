// 予約確認ダイアログコンポーネント（モバイル最適化）
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CalendarCheck,
  CalendarIcon,
  ClockIcon,
  InfoIcon,
  Scissors,
  Users,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import type { TimeSlot, MenuOption } from "@/lib/types";

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

export const ReservationConfirmationDialog: React.FC<
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
        <AlertDialogHeader className="bg-gradient-to-r from-slate-600 to-blue-700 p-4 sm:p-6 sticky top-0 z-10">
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
