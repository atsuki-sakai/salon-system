"use client";
import { useState, useEffect, useRef } from "react";
import { FileImage } from "@/components/common";
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
import { Id, Doc } from "@/convex/_generated/dataModel";
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
  const [selectValue, setSelectValue] = useState(""); // Selectの内部状態を管理
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStaffSelect = (staffId: string) => {
    if (staffId === "all") {
      const allStaffIds =
        salonStaffs?.map((staff: Doc<"staff">) => staff._id) || [];
      setSelectedStaffIds(allStaffIds);
      setValue("availableStaffIds", allStaffIds);
      setSelectValue(""); // 内部状態をリセット
    } else {
      if (selectedStaffIds.includes(staffId)) {
        toast.error("既に選択されているスタッフです");
        return;
      }
      const newStaffIds = [...selectedStaffIds, staffId];
      setSelectedStaffIds(newStaffIds);
      setValue("availableStaffIds", newStaffIds);
      setSelectValue(""); // 選択後にリセット
    }
  };

  const menu = useQuery(api.menu.getMenu, {
    id: menu_id as Id<"menu">,
  });

  // サロン内の全スタッフ情報を取得
  const salonStaffs = useQuery(api.staff.getAllStaffBySalonId, {
    salonId: id as Id<"salon">,
  });

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
        price: menu.price,
        salePrice: menu.salePrice,
        timeToMin: menu.timeToMin.toString(),
        imgFileId: menu.imgFileId || "",
        description: menu.description || "",
        targetGender: menu.targetGender || "全て",
        couponId: menu.couponId || "",
        category: menu.category || "", // カテゴリーの初期値を追加
      });
      setSelectedStaffIds(menu.availableStaffIds || []);
      setSelectedTargetGender(menu.targetGender || "全て");
    }
  }, [menu, reset]);

  const updateMenu = useMutation(api.menu.update);
  const deleteMenu = useMutation(api.menu.trash);

  const removeStaff = (staffId: string) => {
    const newStaffIds = selectedStaffIds.filter((id) => id !== staffId);
    setSelectedStaffIds(newStaffIds);
    setValue("availableStaffIds", newStaffIds);
  };
  const deleteFile = useMutation(api.storage.deleteFile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const onSubmit = async (data: z.infer<typeof menuSchema>) => {
    try {
      let imageFileId = data.imgFileId || "";

      // ファイルが選択されている場合、アップロード処理を実施
      if (
        fileInputRef.current?.files &&
        fileInputRef.current.files.length > 0
      ) {
        const file = fileInputRef.current.files[0];
        const maxSize = 2 * 1024 * 1024;
        if (file && file.size > maxSize) {
          toast.error(
            "ファイルサイズが大きすぎます。2MB以下の画像をアップロードしてください。"
          );
          return;
        }

        // 例：アップロードURLの取得とファイルアップロード処理
        const uploadUrl = await generateUploadUrl();
        const results = await fetch(uploadUrl, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file ? file.type : "image/*" },
        });
        const resultData = await results.json();
        imageFileId = resultData.storageId;
      }

      // メニュー更新処理
      await updateMenu({
        id: menu_id as Id<"menu">,
        name: data.name,
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        timeToMin: Number(data.timeToMin),
        imgFileId: imageFileId,
        availableStaffIds: selectedStaffIds,
        description: data.description || "",
        couponId: data.couponId || "",
        targetGender: data.targetGender || "全て",
        category: data.category, // カテゴリー情報を更新
      });

      // 新しい画像がアップロードされた場合、古い画像が存在すれば削除する
      if (
        fileInputRef.current?.files &&
        fileInputRef.current.files.length > 0 &&
        menu?.imgFileId &&
        menu.imgFileId !== imageFileId
      ) {
        await deleteFile({ storageId: menu.imgFileId });
      }

      toast.success("メニューを更新しました");
      router.push(`/dashboard/${id}/menu`);
    } catch (error) {
      console.error(error);
      toast.error("メニューの更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (confirm("本当にこのメニューを削除しますか？")) {
      try {
        await deleteMenu({
          id: menu_id as Id<"menu">,
        });
        if (menu?.imgFileId) {
          await deleteFile({
            storageId: menu.imgFileId,
          });
        }
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
        <div className="flex gap-4">
          <FileImage fileId={menu.imgFileId} size={128} />
          <div>
            <Label htmlFor="imageFile">メニュー画像</Label>
            <Input type="file" ref={fileInputRef} accept="image/*" />
            {errors.imgFileId && (
              <p className="text-sm mt-1 text-red-500">
                {errors.imgFileId.message}
              </p>
            )}
          </div>
        </div>
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
            onValueChange={(value) => setValue("timeToMin", value)}
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
        {/* カテゴリー入力フィールドを追加 */}
        <div>
          <Label htmlFor="category" className="font-bold">
            カテゴリー
          </Label>
          <Input {...register("category")} placeholder="カテゴリーを入力" />
          {errors.category && (
            <p className="text-sm mt-1 text-red-500">
              {errors.category.message}
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
          <Label htmlFor="staffIds" className="font-bold">
            対応スタッフ
          </Label>
          {salonStaffs?.length === 0 ? (
            <p className="text-sm text-gray-500">スタッフがありません</p>
          ) : (
            <Select
              value={selectValue}
              onValueChange={(value) => {
                setSelectValue(value);
                handleStaffSelect(value);
              }}
            >
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
          {errors.availableStaffIds && (
            <p className="text-sm mt-1 text-red-500">
              {errors.availableStaffIds.message}
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
            戻る
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
