"use client";
import { useState, useRef } from "react";
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
import { useSalonCore } from "@/hooks/useSalonCore";
export default function MenuCreatePage() {
  const params = useParams();
  const router = useRouter();
  const { isSubscribed } = useSalonCore();
  const id = typeof params.id === "string" ? params.id : "";
  // ファイルアップロード用の ref を追加
  const fileInputRef = useRef<HTMLInputElement>(null);
  // アップロード URL を生成するミューテーション
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useZodForm(menuSchema);

  const createMenu = useMutation(api.menu.add);
  const salonStaffs = useQuery(api.staff.getAllStaffBySalonId, {
    salonId: id as Id<"salon">,
  });

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const menus = useQuery(api.menu.getMenusBySalonId, {
    salonId: id as Id<"salon">,
  });

  if (!menus) {
    return <Loading />;
  }

  if (!isSubscribed) {
    return (
      <div className="text-center text-sm text-gray-500 min-h-[500px] flex items-center justify-center">
        サブスクリプション契約が必要です。
      </div>
    );
  }
  const handleStaffSelect = (staffId: string) => {
    if (staffId === "all") {
      const allStaffIds = salonStaffs?.map((staff) => staff._id) || [];
      setSelectedStaffIds(allStaffIds);
      setValue("availableStaffIds", allStaffIds);
    } else {
      if (selectedStaffIds.includes(staffId)) {
        toast.error("既に選択されているスタッフです");
        return;
      }
      const newStaffIds = [...selectedStaffIds, staffId];
      setSelectedStaffIds(newStaffIds);
      setValue("availableStaffIds", newStaffIds);
    }
  };

  const removeStaff = (staffId: string) => {
    const newStaffIds = selectedStaffIds.filter((id) => id !== staffId);
    setSelectedStaffIds(newStaffIds);
    setValue("availableStaffIds", newStaffIds);
  };

  const onSubmit = async (data: z.infer<typeof menuSchema>) => {
    try {
      if (!id) {
        throw new Error("Invalid salon ID");
      }

      // まずはテキスト入力（画像URL）の値を使用
      let imageFileId = data.imgFileId || "";
      // もしファイルが選択されていれば、ファイルアップロード処理を実行
      if (
        fileInputRef.current &&
        fileInputRef.current.files &&
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
        const uploadUrl = await generateUploadUrl();
        const results = await fetch(uploadUrl, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file ? file.type : "image/*" },
        });
        const resultData = await results.json();
        imageFileId = resultData.storageId;
      }

      await createMenu({
        name: data.name,
        price: Number(data.price),
        timeToMin: Number(data.timeToMin),
        imgFileId: imageFileId,
        availableStaffIds: selectedStaffIds,
        salonId: id,
        description: data.description || "",
        couponId: data.couponId || "",
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        targetGender: data.targetGender as "全て" | "男性" | "女性",
        category: data.category, // 追加：カテゴリー情報を送信
      });
      toast.success("メニューを追加しました");

      const redirectUrl = `/dashboard/${encodeURIComponent(id)}/menu`;
      router.push(redirectUrl);
    } catch (error) {
      console.error(error);
      toast.error("メニューの追加に失敗しました");
    }
  };

  const handleGoBack = () => {
    const redirectUrl = `/dashboard/${encodeURIComponent(id)}/menu`;
    router.push(redirectUrl);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-4 sticky top-0 bg-white py-4 z-10">
        <Link href={`/dashboard/${id}/menu`}>
          <span className="text-sm text-indigo-700 flex items-center justify-start gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>メニュー一覧</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">メニューを追加</h1>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log(errors);
        })}
        className="flex flex-col space-y-6"
      >
        <div>
          <Label htmlFor="file" className="font-bold">
            メニュー画像（アップロード）
          </Label>
          {/* ファイルアップロード用の Input：ここでは register は使用せず、ref 経由でアクセス */}
          <Input type="file" ref={fileInputRef} accept="image/*" />
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
          <Input
            {...register("price", { valueAsNumber: true })}
            type="number"
          />
          {errors.price && (
            <p className="text-sm mt-1 text-red-500">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="salePrice" className="font-bold">
            セール価格（円）
          </Label>
          <Input
            {...register("salePrice", { valueAsNumber: true })}
            type="number"
          />
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
            {...register("timeToMin")}
            onValueChange={(value) => {
              setValue("timeToMin", value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="所要時間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10分</SelectItem>
              <SelectItem value="20">20分</SelectItem>
              <SelectItem value="30">30分</SelectItem>
              <SelectItem value="40">40分</SelectItem>
              <SelectItem value="50">50分</SelectItem>
              <SelectItem value="60">60分</SelectItem>
              <SelectItem value="70">70分</SelectItem>
              <SelectItem value="80">80分</SelectItem>
              <SelectItem value="90">90分</SelectItem>
              <SelectItem value="100">100分</SelectItem>
              <SelectItem value="110">110分</SelectItem>
              <SelectItem value="120">120分</SelectItem>
              <SelectItem value="130">130分</SelectItem>
              <SelectItem value="140">140分</SelectItem>
              <SelectItem value="150">150分</SelectItem>
              <SelectItem value="160">160分</SelectItem>
              <SelectItem value="170">170分</SelectItem>
              <SelectItem value="180">180分</SelectItem>
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
            className="h-32"
          />
          {errors.description && (
            <p className="text-sm mt-1 text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
        {/* ここからカテゴリー入力フィールドを追加 */}
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
          <Select {...register("targetGender")} defaultValue="全て">
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
          {errors.availableStaffIds && (
            <p className="text-sm mt-1 text-red-500">
              {errors.availableStaffIds.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="couponIds" className="font-bold">
            適用クーポン
          </Label>
          <Input {...register("couponId")} />
          {errors.couponId && (
            <p className="text-sm mt-1 text-red-500">
              {errors.couponId.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-4 pt-5">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            戻る
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "追加中..." : "メニューを追加"}
          </Button>
        </div>
      </form>
    </div>
  );
}
