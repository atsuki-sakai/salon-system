"use client";

import { FileImage } from "@/components/common";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loading } from "@/components/common";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export default function MenuPage() {
  const { id } = useParams();
  const menus = useQuery(api.menu.getMenusBySalonId, {
    salonId: id as Id<"salon">,
  });
  const deleteMenu = useMutation(api.menu.trash);
  const staffs = useQuery(api.staff.getAllStaffBySalonId, {
    salonId: id as Id<"salon">,
  });

  if (!menus) {
    return <Loading />;
  }

  const handleDeleteMenu = async (menuId: Id<"menu">) => {
    const alert = await confirm("本当にメニューを削除しますか？");
    if (alert) {
      try {
        await deleteMenu({
          id: menuId,
        });
        toast.success("メニューを削除しました");
      } catch (error) {
        console.error("削除エラー:", error);
        toast.error("メニューの削除に失敗しました");
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-12">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">
            メニュー管理
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            美容室のメニュー一覧です。各メニューの名前、価格、所要時間などを
            ご確認いただけます。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/dashboard/${id}/menu/create`}
            className="block rounded-md bg-indigo-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            メニューを追加
          </Link>
        </div>
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {menus.map((menu) => (
          <li
            key={menu._id}
            className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex flex-col p-4">
              <div className="flex justify-center">
                <FileImage fileId={menu.imgFileId} size={128} />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">
                {menu.name}
              </h3>
              <dl className="flex grow flex-col justify-between">
                <dt className="text-xs font-medium text-slate-700 mb-3">
                  価格と所要時間
                </dt>
                {menu.salePrice ? (
                  <dd className="text-base tracking-wide">
                    <div className="flex flex-col">
                      <span className="text-green-700 text-lg font-bold">
                        ¥{menu.salePrice.toLocaleString()}
                      </span>
                      <span className="line-through text-xs text-gray-500">
                        ¥{menu.price.toLocaleString()}
                      </span>
                    </div>
                  </dd>
                ) : (
                  <dd className="text-lg mt-4 tracking-wide text-green-700 font-bold">
                    ¥{menu.price.toLocaleString()}
                  </dd>
                )}
              </dl>
              <div className="mt-3 text-base text-gray-800">
                <span className="text-sm">作業時間</span>{" "}
                <span className="text-gray-800 font-bold">
                  {menu.timeToMin}{" "}
                </span>
                分
              </div>
            </div>
            <div>
              <div className="px-4 py-2 ">
                <p className="text-xs">対応可能スタッフ</p>
                <div className="flex text-sm text-gray-500 tracking-wide font-bold py-2 h-fit overflow-y-hidden">
                  {menu.availableStaffIds.map((staffId) => {
                    const staff = staffs?.find(
                      (staff) => staff._id === staffId
                    );
                    return staff ? (
                      <span
                        key={staffId}
                        className={`mr-2 whitespace-nowrap text-xs border font-semibold text-blue-600 rounded-md px-2 bg-blue-100`}
                      >
                        {staff.name}
                      </span>
                    ) : null;
                  })}
                  {menu.availableStaffIds.length === 0 && (
                    <span className="text-gray-500">未設定</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs">クーポンコード</p>
                <p className="text-sm text-gray-500 tracking-wide font-bold">
                  {menu.couponId ? menu.couponId : "未設定"}
                </p>
              </div>
            </div>
            <div className="px-4 py-2 h-fit min-h-[100px] overflow-y-hidden">
              <p className="text-sm text-gray-500">
                {menu.description?.slice(0, 60) + "..."}
              </p>
            </div>
            <div>
              <div className="-mt-px flex divide-x divide-gray-200">
                <div className="flex w-0 flex-1">
                  <Link
                    href={`/dashboard/${id}/menu/edit/${menu._id}`}
                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <PencilIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    編集
                  </Link>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <button
                    onClick={() => handleDeleteMenu(menu._id)}
                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <TrashIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    削除
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
