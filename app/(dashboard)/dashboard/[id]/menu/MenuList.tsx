"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileImage } from "@/components/common";
import {
  ClockIcon,
  TagIcon,
  InfoIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";

export default function MenuList({ id }: { id: Id<"salon"> }) {
  const staffs = useQuery(api.staff.getAllStaffBySalonId, {
    salonId: id as Id<"salon">,
  });

  const {
    results: menus,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.menu.getMenusBySalonId,
    {
      salonId: id as Id<"salon">,
      sortDirection: "desc",
    },
    { initialNumItems: 10 }
  );

  const deleteMenu = useMutation(api.menu.trash);
  const deleteFile = useMutation(api.storage.deleteFile);

  const handleDeleteMenu = async (menuId: Id<"menu">, storageId?: string) => {
    try {
      await deleteMenu({
        id: menuId,
      });
      if (storageId) {
        await deleteFile({
          storageId: storageId,
        });
      }
      toast.success("メニューを削除しました");
    } catch (error) {
      console.error("削除エラー:", error);
      toast.error("メニューの削除に失敗しました");
    }
  };
  if (
    (status === "LoadingFirstPage" || status === "LoadingMore") &&
    menus.length === 0
  ) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {menus.map((menu) => (
        <Card
          key={menu._id}
          className="overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col h-full"
        >
          <CardHeader className="pb-2 pt-4">
            <div className="flex justify-center mb-3">
              <FileImage fileId={menu.imgFileId} size={128} />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">
              {menu.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 px-4 flex-grow">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">価格</p>
              {menu.salePrice ? (
                <div className="flex flex-col">
                  <span className="text-green-700 text-lg font-bold">
                    ¥{menu.salePrice.toLocaleString()}
                  </span>
                  <span className="line-through text-xs text-slate-400">
                    ¥{menu.price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-green-700">
                  ¥{menu.price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                作業時間:{" "}
                <span className="font-semibold">{menu.timeToMin}</span> 分
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                対応可能スタッフ
              </p>
              <div className="flex flex-wrap gap-1.5">
                {menu.availableStaffIds.length > 0 ? (
                  menu.availableStaffIds.map((staffId) => {
                    const staff = staffs?.find(
                      (staff) => staff._id === staffId
                    );
                    return staff ? (
                      <Badge
                        key={staffId}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {staff.name}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-xs text-slate-400">未設定</span>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <TagIcon className="h-4 w-4 text-slate-400 mt-0.5 mr-2" />
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  クーポンコード
                </p>
                <span className="text-sm text-slate-600 font-medium">
                  {menu.couponId || "未設定"}
                </span>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="min-h-[60px] overflow-hidden">
              <div className="flex items-start">
                <InfoIcon className="h-4 w-4 text-slate-400 mt-0.5 mr-2 flex-shrink-0" />
                {menu.description ? (
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {menu.description?.slice(0, 60) + "..." ||
                      "商品説明はありません"}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">説明はありません</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between p-0 bg-slate-50 mt-auto">
            <Button
              asChild
              variant="ghost"
              className="flex-1 rounded-none rounded-bl-lg h-12 text-white font-bold bg-blue-500 hover:bg-blue-600 hover:text-white"
            >
              <Link href={`/dashboard/${id}/menu/edit/${menu._id}`}>
                <PencilIcon className="h-4 w-4 mr-2" />
                編集
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-12" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 rounded-none rounded-br-lg bg-red-500 text-white hover:text-white font-bold hover:bg-red-600 h-12"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>メニューの削除</AlertDialogTitle>
                  <AlertDialogDescription>
                    このメニューを削除してもよろしいですか？この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteMenu(menu._id, menu.imgFileId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}

      {/* ページネーションコントロール */}
      {menus.length > 0 && status !== "Exhausted" && (
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
    </div>
  );
}
