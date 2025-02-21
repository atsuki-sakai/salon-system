import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
const menuItems = [
  {
    name: "カット",
    category: "カット",
    price: "3,000円",
    duration: "約30分",
    coolingTime: "約10分",
    availableStaffs: ["山田 花子", "佐藤 太郎"],
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
  },
  {
    name: "パーマ",
    category: "パーマ",
    price: "5,000円",
    duration: "約60分",
    coolingTime: "約10分",
    availableStaffs: ["山田 花子", "佐藤 太郎"],
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
  },
  {
    name: "カラー",
    category: "カラー",
    price: "4,500円",
    duration: "約45分",
    coolingTime: "約10分",
    availableStaffs: ["山田 花子", "佐藤 太郎"],
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
  },
];

export default function SalonMenuPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-12 ">
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
            メニューを追加
          </button>
        </div>
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {menuItems.map((item) => (
          <li
            key={item.name}
            className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex flex-1 flex-col p-8">
              <Image
                alt={item.name}
                src={item.imageUrl}
                className="mx-auto h-[250px] w-full shrink-0 object-cover"
                width={128}
                height={128}
              />
              <h3 className="mt-6 text-xl font-bold text-gray-900">
                {item.name}
              </h3>
              <dl className="flex grow flex-col justify-between mt-4">
                <dt className="text-xs font-medium text-slate-700">
                  価格と所要時間
                </dt>
                <dd className=" text-base mt-2 tracking-wide">
                  {item.price} / {item.duration}
                  <br />
                  準備時間: {item.coolingTime}
                </dd>
              </dl>
              <div className="mt-3 w-full flex flex-col gap-2">
                <p className="text-xs font-medium text-slate-700">
                  対応可能スタッフ
                </p>
                <ul className="flex flex-wrap gap-2 text-gray-900">
                  {item.availableStaffs.map((staff) => (
                    <li key={staff}>
                      <span className="text-sm font-medium border border-gray-200 bg-gray-100 px-2 py-1 rounded-full">
                        {staff}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <div className="-mt-px flex divide-x divide-gray-200">
                <div className="flex w-0 flex-1">
                  <a
                    href="#"
                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <PencilSquareIcon
                      aria-hidden="true"
                      className="h-5 w-5 text-gray-400"
                    />
                    編集
                  </a>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <a
                    href="#"
                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <TrashIcon
                      aria-hidden="true"
                      className="h-5 w-5 text-gray-400"
                    />
                    削除
                  </a>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
