"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useZodForm } from "@/hooks/useZodForm";
import { menuSchema } from "@/lib/validations";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { Loading } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function MenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const { id, menu_id } = params;
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedTargetGender, setSelectedTargetGender] = useState<
    "全て" | "男性" | "女性"
  >("全て");

  const menu = useQuery(api.menus.getMenu, {
    id: menu_id as Id<"menus">,
  });

  const selectedStaffs = useQuery(api.staffs.getStaffsByStaffIds, {
    staffIds: menu?.staffIds as Id<"staffs">[],
  });
  const salonStaffs = useQuery(api.staffs.getStaffsBySalonId, {
    salonId: id as Id<"users">,
  });
  console.log(salonStaffs);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useZodForm(menuSchema);

  useEffect(() => {
    if (menu) {
      reset({
        name: menu.name,
        price: menu.price.toString(),
        salePrice: menu.salePrice?.toString() || "",
        timeToMin: menu.timeToMin.toString(),
        image: menu.image || "",
        description: menu.description || "",
        targetGender: menu.targetGender || "全て",
        couponId: menu.couponId || "",
      });
      setSelectedStaffIds(menu.staffIds || []);
      setSelectedTargetGender(menu.targetGender || "全て");
    }
  }, [menu, reset]);

  const updateMenu = useMutation(api.menus.updateMenu);
  const deleteMenu = useMutation(api.menus.deleteMenu);

  const removeStaff = (staffId: string) => {
    const newStaffIds = selectedStaffIds.filter((id) => id !== staffId);
    setSelectedStaffIds(newStaffIds);
    setValue("staffIds", newStaffIds);
  };

  const onSubmit = async (data: z.infer<typeof menuSchema>) => {
    try {
      await updateMenu({
        id: menu_id as Id<"menus">,
        name: data.name,
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        timeToMin: Number(data.timeToMin),
        image: data.image || "",
        staffIds: selectedStaffIds,
        salonId: id as string,
        description: data.description || "",
        couponId: data.couponId || "",
        targetGender: data.targetGender || "全て",
      });
      toast.success("メニューを更新しました");
      router.push(`/dashboard/${id}/menu`);
    } catch (error) {
      console.error(error);
      toast.error("メニューの更新に失敗しました");
    }
  };
  const handleStaffSelect = (staffId: string) => {
    if (staffId === "all") {
      const allStaffIds = selectedStaffs?.map((staff) => staff!._id) || [];
      setSelectedStaffIds(allStaffIds);
      setValue("staffIds", allStaffIds);
    } else {
      if (selectedStaffIds.includes(staffId)) {
        toast.error("既に選択されているスタッフです");
        return;
      }
      const newStaffIds = [...selectedStaffIds, staffId];
      setSelectedStaffIds(newStaffIds);
      setValue("staffIds", newStaffIds);
    }
  };

  const handleDelete = async () => {
    if (confirm("本当にこのメニューを削除しますか？")) {
      try {
        await deleteMenu({
          id: menu_id as Id<"menus">,
        });
        toast.success("メニューを削除しました");
        router.push(`/dashboard/${id}/menu`);
      } catch (error) {
        console.error(error);
        toast.error("メニューの削除に失敗しました");
      }
    }
  };

  if (!menu) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${id}/menu`}>
          <span className="text-sm text-indigo-700 flex items-center justify-start gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>メニュー一覧</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">メニューを編集</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6"
      >
        <div>
          <Label htmlFor="name" className="font-bold">
            メニュー名
          </Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm mt-1 text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="price" className="font-bold">
            料金（円）
          </Label>
          <Input {...register("price")} type="number" />
          {errors.price && (
            <p className="text-sm mt-1 text-red-500">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="salePrice" className="font-bold">
            セール価格（円）
          </Label>
          <Input {...register("salePrice")} type="number" />
          {errors.salePrice && (
            <p className="text-sm mt-1 text-red-500">
              {errors.salePrice.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="timeToMin" className="font-bold">
            所要時間（分）
          </Label>
          <Select
            defaultValue={menu.timeToMin.toString()}
            onValueChange={(value) => {
              setValue("timeToMin", value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="所要時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 18 }, (_, i) => (i + 1) * 10).map(
                (minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes}分
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.timeToMin && (
            <p className="text-sm mt-1 text-red-500">
              {errors.timeToMin.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="description" className="font-bold">
            メニュー説明
          </Label>
          <Textarea
            {...register("description")}
            placeholder="メニューの詳細説明を入力してください"
            rows={12}
          />
          {errors.description && (
            <p className="text-sm mt-1 text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="targetGender" className="font-bold">
            対象性別
          </Label>
          <Select
            value={selectedTargetGender || menu.targetGender}
            onValueChange={(value) => {
              setSelectedTargetGender(value as "全て" | "男性" | "女性");
              setValue("targetGender", value as "全て" | "男性" | "女性");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="対象性別を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全て">全て</SelectItem>
              <SelectItem value="男性">男性</SelectItem>
              <SelectItem value="女性">女性</SelectItem>
            </SelectContent>
          </Select>
          {errors.targetGender && (
            <p className="text-sm mt-1 text-red-500">
              {errors.targetGender.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="image">メニュー画像（任意）</Label>
          <Input
            type="text"
            {...register("image")}
            placeholder="画像URLを入力（任意）"
          />
          {errors.image && (
            <p className="text-sm mt-1 text-red-500">{errors.image.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="staffIds" className="font-bold">
            対応スタッフ
          </Label>
          {salonStaffs?.length === 0 ? (
            <p className="text-sm text-gray-500">スタッフがありません</p>
          ) : (
            <Select onValueChange={handleStaffSelect}>
              <SelectTrigger>
                <SelectValue placeholder="対応スタッフを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて選択</SelectItem>
                {salonStaffs?.map((staff) => (
                  <SelectItem
                    key={staff._id}
                    value={staff._id}
                    disabled={selectedStaffIds.includes(staff._id)}
                  >
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedStaffIds.map((staffId) => {
              const staff = salonStaffs?.find((s) => s._id === staffId);
              if (!staff) return null;
              return (
                <Badge key={staffId} variant="secondary">
                  {staff.name}
                  <button
                    type="button"
                    onClick={() => removeStaff(staffId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          {errors.staffIds && (
            <p className="text-sm mt-1 text-red-500">
              {errors.staffIds.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="couponId" className="font-bold">
            適用クーポン
          </Label>
          <Input {...register("couponId")} />
          {errors.couponId && (
            <p className="text-sm mt-1 text-red-500">
              {errors.couponId.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/${id}/menu`)}
          >
            キャンセル
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            削除
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "メニューを更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}
