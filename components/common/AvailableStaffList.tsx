import Image from "next/image";
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

export default function AvailableStaffList() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-gray-200">
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
