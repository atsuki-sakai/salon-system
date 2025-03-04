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

export default function NextTreatment() {
  return (
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
  );
}
