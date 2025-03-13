"use client";

import Link from "next/link";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loading } from "@/components/common";
import { FileImage } from "@/components/common";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Edit,
  User,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Id, Doc } from "@/convex/_generated/dataModel";

// 日付関連のユーティリティ関数を追加
const getTodayISOString = () => new Date().toISOString().split("T")[0];

export default function StaffList() {
  const { id } = useParams();
  const staffs = useQuery(api.staff.getAllStaffBySalonId, {
    salonId: id as Id<"salon">,
  });
  const {
    results: menus,
    loadMore,
    status,
  } = usePaginatedQuery(
    api.menu.getMenusBySalonId,
    {
      salonId: id as Id<"salon">,
      sortDirection: "desc",
    },
    {
      initialNumItems: 20,
    }
  );

  // 休暇日の詳細表示状態を管理する
  const [expandedHolidayStaff, setExpandedHolidayStaff] = useState<
    string | null
  >(null);

  // 休暇日の切り替え処理をメモ化
  const toggleHolidayExpand = useCallback((staffId: string) => {
    setExpandedHolidayStaff((prev) => (prev === staffId ? null : staffId));
  }, []);

  // 休暇日の文字列を日付オブジェクトの配列に変換する関数
  const parseHolidays = useCallback((holidays: string[] | undefined) => {
    if (!holidays) return [];
    return holidays
      .filter((date) => date.trim())
      .map((date) => parseISO(date.trim()));
  }, []);

  // 休暇日の判定を関数として抽出
  const isOnHoliday = useCallback((staff: Doc<"staff">) => {
    const today = getTodayISOString();
    return staff.regularHolidays?.some((holiday) => holiday === today) ?? false;
  }, []);

  // メニューを取得する関数をメモ化
  const getAvailableMenus = useCallback(
    (staffId: Id<"staff">) => {
      return (
        menus?.filter(
          (menu) => menu.availableStaffIds?.includes(staffId) ?? false
        ) || []
      );
    },
    [menus]
  );

  if (!staffs) {
    return <Loading />;
  }
  console.log(JSON.stringify(staffs[0]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* テーブル部分 */}
      <Card className="overflow-hidden border rounded-lg shadow-sm bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-1/4 py-4 font-semibold whitespace-nowrap ">
                    スタッフ情報
                  </TableHead>
                  <TableHead className="w-1/4 py-4 font-semibold whitespace-nowrap">
                    対応メニュー
                  </TableHead>
                  <TableHead className="w-1/4 py-4 font-semibold whitespace-nowrap">
                    休暇日
                  </TableHead>
                  <TableHead className="w-1/8 py-4 font-semibold whitespace-nowrap">
                    状態
                  </TableHead>
                  <TableHead className="w-1/8 py-4 text-right font-semibold">
                    <span className="sr-only">編集</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {staffs.map((staff, index) => {
                    // 休暇日の処理
                    const holidays = parseHolidays(staff.regularHolidays);
                    const nextHolidays = holidays
                      .filter((date) => date >= new Date())
                      .sort((a, b) => a.getTime() - b.getTime())
                      .slice(0, 3); // 次の3つの休暇日を表示

                    // スタッフが対応しているメニュー
                    const availableMenus = getAvailableMenus(staff._id);
                    const isOnHolidayStatus = isOnHoliday(staff);

                    return (
                      <motion.tr
                        key={staff._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeInOut",
                        }}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="py-4 text-sm">
                          <div className="flex  justify-start items-center pl-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="relative"
                            >
                              <FileImage fileId={staff.imgFileId} size={50} />
                              {isOnHolidayStatus && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                              )}
                            </motion.div>
                            <div className="ml-4">
                              <div className="font-semibold text-gray-900 flex items-center">
                                {staff.name}
                              </div>
                              <div className="my-1 text-gray-500 flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                <span>{staff.age}歳</span>
                              </div>

                              {staff.extraCharge && staff.extraCharge > 0 && (
                                <div className="mt-2  text-gray-700 flex items-center gap-1">
                                  <span className="inline-block whitespace-nowrap rounded-full text-sm">
                                    指名料
                                  </span>
                                  <span className="inline-block text-sm">
                                    ¥{staff.extraCharge.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {availableMenus.length > 0 ? (
                              availableMenus.map((menu, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  {menu.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                未設定
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm">
                          {holidays.length > 0 ? (
                            <div className="relative">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleHolidayExpand(staff._id)
                                      }
                                      className="p-0 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {holidays.length}日の休暇
                                      {expandedHolidayStaff === staff._id ? (
                                        <ChevronUp className="h-4 w-4 ml-1" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    クリックして詳細を表示
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <AnimatePresence>
                                {expandedHolidayStaff === staff._id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{
                                      opacity: 1,
                                      height: "auto",
                                      y: 0,
                                    }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md border p-3 z-10"
                                  >
                                    <h4 className="font-medium text-sm mb-2 flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      休暇日一覧
                                    </h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {holidays
                                        .sort(
                                          (a, b) => a.getTime() - b.getTime()
                                        )
                                        .map((date, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                              duration: 0.2,
                                              delay: i * 0.03,
                                            }}
                                            className="text-xs py-1 border-b last:border-b-0"
                                          >
                                            {format(
                                              date,
                                              "yyyy年MM月dd日(EEE)",
                                              {
                                                locale: ja,
                                              }
                                            )}
                                          </motion.div>
                                        ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              未設定
                            </span>
                          )}

                          {nextHolidays.length > 0 && (
                            <motion.div
                              className="mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <p className="text-xs text-gray-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                次回の休暇:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {nextHolidays.map((date, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 border-amber-200"
                                  >
                                    {format(date, "MM/dd(EEE)", { locale: ja })}
                                  </Badge>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-sm">
                          {isOnHolidayStatus ? (
                            <Badge
                              variant="destructive"
                              className="bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                              休暇中
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 whitespace-nowrap text-green-700 border-green-200 hover:bg-green-100 transition-colors"
                            >
                              稼働中
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-right">
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Link
                              href={`/dashboard/${id}/staff/edit/${staff._id}`}
                            >
                              <Button
                                variant="default"
                                size="lg"
                                className="h-8 gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                              >
                                <Edit className="h-4 w-4" />
                                編集
                              </Button>
                            </Link>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {staffs.length > 0 && status !== "Exhausted" && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => loadMore(10)}
            disabled={status === "LoadingMore"}
            variant="outline"
            className="flex items-center gap-2"
          >
            {status === "LoadingMore" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
                読み込み中...
              </>
            ) : (
              <>さらに表示する</>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
