"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loading } from "@/components/common";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarIcon, PencilIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
// デフォルトのスタッフ画像
const DEFAULT_STAFF_IMAGE =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60";

// 日付関連のユーティリティ関数を追加
const getTodayISOString = () => new Date().toISOString().split("T")[0];

// 型定義の追加
type Staff = {
  _id: string;
  name: string;
  gender?: string;
  email: string;
  phone?: string;
  image?: string;
  menuIds?: string[];
  holidays?: string[];
};

export default function StaffPage() {
  const { id } = useParams();
  const staffs = useQuery(api.staffs.getStaffsBySalonId, {
    salonId: id as Id<"users">,
  });
  const menus = useQuery(api.menus.getMenusBySalonId, {
    salonId: id as Id<"users">,
  });

  // 休暇日の詳細表示状態を管理する
  const [expandedHolidayStaff, setExpandedHolidayStaff] = useState<
    string | null
  >(null);

  if (!staffs) {
    return <Loading />;
  }

  // 休暇日の文字列を日付オブジェクトの配列に変換する関数
  const parseHolidays = (holidays: string[] | undefined) => {
    if (!holidays) return [];
    return holidays
      .filter((date) => date.trim())
      .map((date) => parseISO(date.trim()));
  };

  // 休暇日の判定を関数として抽出
  const isOnHoliday = (staff: Staff) => {
    const today = getTodayISOString();
    return staff.holidays?.some((holiday) => holiday === today) ?? false;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* ヘッダー部分 */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">
            美容師スタッフ管理
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            美容室のスタッフ一覧です。各スタッフの名前、担当メニュー、連絡先情報、
            休暇日をご確認いただけます。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/dashboard/${id}/staff/create`}
            className="block rounded-md bg-indigo-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            スタッフを追加
          </Link>
        </div>
      </div>

      {/* テーブル部分 */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto h-full sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    スタッフ情報
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    対応メニュー
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    休暇日
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    状態
                  </th>
                  <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-0">
                    <span className="sr-only">編集</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {staffs.map((staff) => {
                  // 休暇日の処理
                  const holidays = parseHolidays(staff.holidays);
                  const nextHolidays = holidays
                    .filter((date) => date >= new Date())
                    .sort((a, b) => a.getTime() - b.getTime())
                    .slice(0, 3); // 次の3つの休暇日を表示

                  // スタッフが対応しているメニューを表示用に整形
                  // const menuIds = staff.menuIds || [];
                  const availableMenus = menus?.filter(
                    (menu) => menu.staffIds?.includes(staff._id) ?? []
                  );

                  return (
                    <tr key={staff._id}>
                      <td className="py-5 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0">
                        <div className="flex items-center">
                          <div className="size-11 shrink-0">
                            <Image
                              src={staff.image || DEFAULT_STAFF_IMAGE}
                              alt={staff.name}
                              width={44}
                              height={44}
                              className="size-11 rounded-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {staff.name}
                              <span className="ml-2 text-xs text-gray-500">
                                {staff.gender}
                              </span>
                            </div>
                            <div className="mt-1 text-gray-500">
                              {staff.email}
                            </div>
                            <div className="mt-1 text-gray-500">
                              {staff.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {availableMenus && availableMenus.length > 0 ? (
                            availableMenus.map((menu, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset"
                              >
                                {menu.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">未設定</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-5 text-sm text-gray-500">
                        {holidays.length > 0 ? (
                          <div className="relative">
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        setExpandedHolidayStaff(
                                          expandedHolidayStaff === staff._id
                                            ? null
                                            : staff._id
                                        )
                                      }
                                      className="flex items-center text-blue-600 hover:text-blue-800"
                                    >
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      {holidays.length}日の休暇
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    クリックして詳細を表示
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            {expandedHolidayStaff === staff._id && (
                              <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md border p-3 z-10">
                                <h4 className="font-medium text-sm mb-2">
                                  休暇日一覧
                                </h4>
                                <div className="max-h-40 overflow-y-auto">
                                  {holidays
                                    .sort((a, b) => a.getTime() - b.getTime())
                                    .map((date, i) => (
                                      <div
                                        key={i}
                                        className="text-xs py-1 border-b last:border-b-0"
                                      >
                                        {format(date, "yyyy年MM月dd日(EEE)", {
                                          locale: ja,
                                        })}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">未設定</span>
                        )}

                        {nextHolidays.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">次回の休暇:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {nextHolidays.map((date, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset"
                                >
                                  {format(date, "MM/dd(EEE)", { locale: ja })}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500">
                        {isOnHoliday(staff) ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
                            休暇中
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                            稼働中
                          </span>
                        )}
                      </td>
                      <td className="relative py-5 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                        <Link
                          href={`/dashboard/${id}/staff/edit/${staff._id}`}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          編集
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}