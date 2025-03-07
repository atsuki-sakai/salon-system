"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import type { TimeSlot } from "@/lib/types";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react";

export default function ReservationTimePicker() {
  const salonId = useParams().id as string;
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );

  const optimalTimeSlots = useQuery(
    api.reservation.findOptimalTimeSlots,
    selectedMenuId && selectedStaffId
      ? {
          menuId: selectedMenuId as Id<"menu">,
          salonId,
          staffId: selectedStaffId as Id<"staff">,
        }
      : "skip"
  );

  // メニュー一覧とスタッフ一覧は既存のAPIから取得
  const menus = useQuery(api.menu.getMenusBySalonId, { salonId });
  const staffs = useQuery(api.staff.getAllStaffBySalonId, { salonId });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

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

  // スロットを日付ごとにグループ化する関数
  const groupSlotsByDate = () => {
    const grouped: Record<string, TimeSlot[]> = {};

    availableSlots.forEach((slot) => {
      if (slot.date && typeof slot.date === "string") {
        grouped[slot.date] = grouped[slot.date] || [];
        grouped[slot.date]?.push(slot);
      }
    });

    return grouped;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardTitle className="text-xl font-bold text-center text-indigo-800">
          予約時間を選択
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* メニュー選択セクション */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <Badge variant="outline" className="text-indigo-700 px-2 py-1">
                STEP 1
              </Badge>
              メニューを選択
            </div>
            <Select onValueChange={(value) => setSelectedMenuId(value)}>
              <SelectTrigger className="w-full border-2 border-indigo-100 ring-offset-indigo-100">
                <SelectValue placeholder="メニューを選択" />
              </SelectTrigger>
              <SelectContent>
                {menus?.map((menu) => (
                  <SelectItem key={menu._id} value={menu._id}>
                    {menu.name} ({menu.timeToMin}分)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* スタッフ選択セクション */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <Badge variant="outline" className="text-indigo-700 px-2 py-1">
                STEP 2
              </Badge>
              スタッフを指定（任意）
            </div>
            <Select
              onValueChange={(value) => {
                // "unspecified" の場合は空文字列をセット
                setSelectedStaffId(value === "unspecified" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full border-2 border-indigo-100 ring-offset-indigo-100">
                <SelectValue placeholder="スタッフ指定（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">
                  指定なし（最短予約）
                </SelectItem>
                {staffs?.map((staff) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 予約可能な時間枠セクション */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <Badge variant="outline" className="text-indigo-700 px-2 py-1">
                STEP 3
              </Badge>
              日時を選択
            </div>

            {availableSlots.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupSlotsByDate()).map(([date, slots]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-indigo-600" />
                      <h3 className="font-medium text-gray-700">{date}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {slots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={
                            selectedTimeSlot?.date === slot.date &&
                            selectedTimeSlot?.startTime === slot.startTime
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            setSelectedTimeSlot(slot);
                            toast.success(
                              `選択: ${slot.date} ${slot.startTime}〜${slot.endTime}`,
                              {
                                className:
                                  "bg-indigo-50 text-indigo-800 border-indigo-200",
                              }
                            );
                          }}
                          className="h-auto py-2 flex flex-col items-center justify-center text-sm hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                        >
                          <span className="font-medium">
                            {slot.startTime}〜{slot.endTime}
                          </span>
                          <span className="text-xs mt-1">
                            ({slot.staffName})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>利用可能な時間枠が見つかりません</p>
                <p className="text-sm mt-1">
                  メニューとスタッフを選択してください
                </p>
              </div>
            )}
          </div>

          {/* 選択した時間枠の確認 */}
          {selectedTimeSlot && (
            <div className="mt-6">
              <Card className="bg-indigo-50 border-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-indigo-800">
                    選択された予約時間
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">
                        {selectedTimeSlot.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-indigo-600" />
                      <span>
                        {selectedTimeSlot.startTime}〜{selectedTimeSlot.endTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                    <span>{selectedTimeSlot.staffName}</span>
                  </div>

                  <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
                    この日時で予約を確定する
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
