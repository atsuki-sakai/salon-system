"use client";

import Image from "next/image";

const staff = [
  {
    name: "山田 花子",
    title: "スタイリスト",
    department: "カット",
    email: "hanako.yamada@example.com",
    role: "正社員",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&w=256&h=256&q=80",
  },
  {
    name: "佐藤 太郎",
    title: "カラーリスト",
    department: "カラー",
    email: "taro.sato@example.com",
    role: "パートタイマー",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=facearea&w=256&h=256&q=80",
  },
  // 他のスタッフデータを追加...
];

export default function StaffPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* ヘッダー部分 */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">
            美容師スタッフ管理
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            美容室のスタッフ一覧です。各スタッフの名前、役職、担当業務、メールアドレス、
            雇用形態をご確認いただけます。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            スタッフを追加
          </button>
        </div>
      </div>
      {/* テーブル部分 */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    名前
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    役職
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    勤務状況
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    雇用形態
                  </th>
                  <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-0">
                    <span className="sr-only">編集</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {staff.map((person) => (
                  <tr key={person.email}>
                    <td className="py-5 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0">
                      <div className="flex items-center">
                        <div className="size-11 shrink-0">
                          <Image
                            src={person.image}
                            alt={person.name}
                            width={44}
                            height={44}
                            className="size-11 rounded-full"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {person.name}
                          </div>
                          <div className="mt-1 text-gray-500">
                            {person.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500">
                      <div className="text-gray-900">{person.title}</div>
                      <div className="mt-1 text-gray-500">
                        {person.department}
                      </div>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500">
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        稼働中
                      </span>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500">
                      {person.role}
                    </td>
                    <td className="relative py-5 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        編集
                        <span className="sr-only">
                          、{person.name}の情報を編集
                        </span>
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
  );
}
