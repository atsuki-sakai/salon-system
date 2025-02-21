"use client";

import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useUserDetails } from "@/lib/atoms/userAtom";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
const people = [
  {
    staff_name: "佐藤 ありさ",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー"],
    staffImg:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    staff_name: "鈴木 太郎",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー", "パーマ"],
    staffImg:
      "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastSeen: "14:00",
    lastSeenDateTime: "2023-01-23T13:23Z",
  },
  {
    staff_name: "田中 花子",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー", "パーマ"],
    staffImg:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastSeen: null,
  },
  {
    staff_name: "山田 太郎",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー", "パーマ"],
    staffImg:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastSeen: "14:00",
    lastSeenDateTime: "2023-01-23T13:23Z",
  },
  {
    staff_name: "小林 次郎",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー", "パーマ"],
    staffImg:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastSeen: "15:00",
    lastSeenDateTime: "2023-01-23T13:23Z",
  },
  {
    staff_name: "高橋 三郎",
    start_time: "10:00",
    end_time: "12:00",
    menus: ["カット", "カラー", "パーマ"],
    staffImg:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastSeen: null,
  },
];

const tablePersons = [
  {
    staff_name: "佐藤 ありさ",
    menus: ["カット", "カラー"],
    start_time: "10:00",
    end_time: "12:00",
    customer_name: "山田 太郎",
    customer_phone: "090-1234-5678",
    customer_note: "パーマをお願いします。以前よりも短くしたい",
  },
  {
    staff_name: "鈴木 太郎",
    menus: ["カット", "カラー", "パーマ"],
    start_time: "10:00",
    end_time: "12:00",
    customer_name: "山田 太郎",
    customer_phone: "090-1234-5678",
  },
  {
    staff_name: "田中 花子",
    menus: ["カット"],
    start_time: "12:00",
    end_time: "14:00",
    customer_name: "山田 太郎",
    customer_phone: "090-1234-5678",
    customer_note: "パーマをお願いします。以前よりも短くしたい",
  },
];

export default function DashboardPage() {
  const { userDetails, isLoading } = useUserDetails();
  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="shrink-0">
            <CheckCircleIcon
              aria-hidden="true"
              className="size-5 text-green-400"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              予約受付ページ
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                以下のリンクをLineの予約ページに設定することで予約受付ページを表示します。
              </p>
              <Button
                className="mt-2"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${process.env.NEXT_PUBLIC_URL}/reserve/${userDetails?.clerkId}`
                  );
                }}
              >
                <p>{`${process.env.NEXT_PUBLIC_URL}/reserve/${userDetails?.clerkId}`}</p>
                <span className="text-sm text-gray-500 ml-2">コピー</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-gray-200">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-gray-900">
              次の施術一覧
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              次の施術一覧を表示します。
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="block rounded-md bg-indigo-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              予約を作成する
            </button>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                    >
                      対応スタッフ
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      開始時刻
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      顧客情報
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      備考
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pr-4 pl-3 sm:pr-6 lg:pr-8"
                    >
                      <span className="sr-only">編集</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tablePersons.map((person) => (
                    <tr key={person.staff_name}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 lg:pl-8">
                        <p className="font-semibold">{person.staff_name}</p>
                        <br />
                        {person.menus.map((menu) => (
                          <span
                            key={menu}
                            className="rounded-full mr-2 bg-indigo-50 px-2 py-1 text-sm text-indigo-600 border border-indigo-600"
                          >
                            {menu}
                          </span>
                        ))}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {person.start_time} - {person.end_time}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {person.customer_name}
                        <br />
                        {person.customer_phone}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {person.customer_note}
                      </td>
                      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 lg:pr-8">
                        <a
                          href="#"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編集
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:flex-auto">
        <h1 className="text-base font-semibold text-gray-900">
          対応可能のスタッフ一覧
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          対応可能なスタッフ一覧を表示します。
        </p>
      </div>
      <ul role="list" className="divide-y divide-gray-100">
        {people.map((person) => (
          <li
            key={person.staff_name}
            className="flex justify-between gap-x-6 py-5"
          >
            <div className="flex min-w-0 gap-x-4">
              <Image
                alt=""
                src={person.staffImg}
                className="size-12 flex-none rounded-full bg-gray-50"
                width={48}
                height={48}
              />
              <div className="min-w-0 flex-auto">
                <p className="text-sm/6 font-semibold text-gray-900">
                  {person.staff_name}
                </p>
                <p className="mt-1 truncate text-xs/5 text-gray-500">
                  {person.menus.map((menu) => menu).join(", ")}
                  <br />
                  {person.start_time} - {person.end_time}
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:flex sm:flex-col sm:items-end">
              {person.lastSeen ? (
                <p className="mt-1 text-xs/5 text-gray-500">
                  次の空き時間:{" "}
                  <time dateTime={person.lastSeenDateTime}>
                    {person.lastSeen}
                  </time>
                </p>
              ) : (
                <div className="mt-1 flex items-center gap-x-1.5">
                  <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs/5 text-gray-500">対応可能</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
