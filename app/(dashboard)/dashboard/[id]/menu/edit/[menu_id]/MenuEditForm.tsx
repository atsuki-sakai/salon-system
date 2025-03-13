// /app/(dashboard)/dashboard/[id]/menu/edit/[menu_id]/MenuEditForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSalonCore } from "@/hooks/useSalonCore";
import { RequiredSubscribe, Loading, ImageDrop } from "@/components/common";
import { useZodForm } from "@/hooks/useZodForm";
import { z } from "zod";
import { menuSchema } from "@/lib/validations";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Info,
  Tag,
  User,
  Ticket,
  X,
  Save,
  Trash2,
  ChartBarBig,
  AlertCircle,
  Camera,
  Calendar,
} from "lucide-react";
import { FaSpa, FaUsers, FaPercentage } from "react-icons/fa";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileImage } from "@/components/common";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

interface MenuEditFormProps {
  id: string;
  menu_id: string;
}

export default function MenuEditForm({ id, menu_id }: MenuEditFormProps) {
  const router = useRouter();
  const { isSubscribed } = useSalonCore();
  const [selectedImgFile, setSelectedImgFile] = useState<File | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedTargetGender, setSelectedTargetGender] = useState<
    "全て" | "男性" | "女性"
  >("全て");
  const [selectValue, setSelectValue] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // メニュー情報を取得
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
    watch,
  } = useZodForm(menuSchema);

  // APIミューテーション
  const updateMenu = useMutation(api.menu.update);
  const deleteMenu = useMutation(api.menu.trash);
  const deleteFile = useMutation(api.storage.deleteFile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // 初期データをフォームにセット
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
        category: menu.category || "",
      });
      setSelectedStaffIds(menu.availableStaffIds || []);
      setSelectedTargetGender(menu.targetGender || "全て");
    }
  }, [menu, reset]);

  if (!menu) return <Loading />;
  if (!isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  // スタッフ選択処理
  const handleStaffSelect = (staffId: string) => {
    if (staffId === "all") {
      const allStaffIds = salonStaffs?.map((staff) => staff._id) || [];
      setSelectedStaffIds(allStaffIds);
      setValue("availableStaffIds", allStaffIds);
      setSelectValue("");
      return;
    }

    if (selectedStaffIds.includes(staffId)) {
      toast.error("既に選択されているスタッフです");
      return;
    }

    const newStaffIds = [...selectedStaffIds, staffId];
    setSelectedStaffIds(newStaffIds);
    setValue("availableStaffIds", newStaffIds);
    setSelectValue("");
  };

  // スタッフ削除処理
  const removeStaff = (staffId: string) => {
    const newStaffIds = selectedStaffIds.filter((id) => id !== staffId);
    setSelectedStaffIds(newStaffIds);
    setValue("availableStaffIds", newStaffIds);
  };

  // フォーム送信処理
  const onSubmit = async (data: z.infer<typeof menuSchema>) => {
    try {
      let imageFileId = data.imgFileId || "";

      // 新しいファイルがアップロードされた場合
      if (selectedImgFile) {
        const maxSize = 2 * 1024 * 1024;
        if (selectedImgFile.size > maxSize) {
          toast.error(
            "ファイルサイズが大きすぎます。2MB以下の画像をアップロードしてください。"
          );
          return;
        }

        const uploadUrl = await generateUploadUrl();
        const results = await fetch(uploadUrl, {
          method: "POST",
          body: selectedImgFile,
          headers: { "Content-Type": selectedImgFile.type },
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
        targetGender: selectedTargetGender,
        category: data.category,
      });

      // 古い画像を削除
      if (selectedImgFile && menu.imgFileId && menu.imgFileId !== imageFileId) {
        await deleteFile({ storageId: menu.imgFileId });
      }

      toast.success("メニューを更新しました");
      router.push(`/dashboard/${id}/menu`);
    } catch (error) {
      console.error(error);
      toast.error("メニューの更新に失敗しました");
    }
  };

  // メニュー削除処理
  const handleDelete = async () => {
    if (confirm("本当にこのメニューを削除しますか？")) {
      try {
        await deleteMenu({
          id: menu_id as Id<"menu">,
        });
        if (menu.imgFileId) {
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

  const handleGoBack = () => {
    router.push(`/dashboard/${id}/menu`);
  };

  // 料金とセール価格の監視
  const price = watch("price");
  const salePrice = watch("salePrice");
  const discountRate =
    price && salePrice ? Math.round((1 - salePrice / price) * 100) : 0;

  // エラーアニメーション
  const errorAnimation = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2 },
  };

  // タブ変更アニメーション
  const tabContentAnimation = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-none mb-8 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                delay: 0.2,
              }}
              className="bg-white bg-opacity-20 p-2 rounded-lg"
            >
              <FaSpa className="h-6 w-6 text-white" />
            </motion.div>
            メニュー編集
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1">
            メニュー情報を編集して更新してください
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-2 w-full mb-2 bg-slate-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                className="text-sm tracking-wide font-bold rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 py-1"
                >
                  <Tag className="h-4 w-4" />
                  基本情報
                </motion.div>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="text-sm tracking-wide font-bold rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 py-1"
                >
                  <Settings className="h-4 w-4" />
                  詳細設定
                </motion.div>
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {activeTab === "basic" && (
                  <motion.div
                    key="basic-tab"
                    {...tabContentAnimation}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* 左側のカラム */}
                      <div className="space-y-6">
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Label
                            htmlFor="name"
                            className="font-bold flex items-center gap-2"
                          >
                            <Tag className="h-4 w-4 text-indigo-600" />
                            メニュー名
                          </Label>
                          <Input
                            id="name"
                            {...register("name")}
                            placeholder="例：カット＆カラー"
                            aria-invalid={!!errors.name}
                            className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                          />
                          <AnimatePresence>
                            {errors.name && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.name.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label
                            htmlFor="category"
                            className="font-bold flex items-center gap-2"
                          >
                            <ChartBarBig className="h-4 w-4 text-indigo-600" />
                            カテゴリー
                          </Label>
                          <Input
                            id="category"
                            {...register("category")}
                            placeholder="例：ヘアスタイリング"
                            aria-invalid={!!errors.category}
                            className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                          />
                          <AnimatePresence>
                            {errors.category && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.category.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Label
                            htmlFor="timeToMin"
                            className="font-bold flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4 text-indigo-600" />
                            所要時間
                          </Label>
                          <Select
                            defaultValue={menu.timeToMin.toString()}
                            onValueChange={(value) =>
                              setValue("timeToMin", value)
                            }
                          >
                            <SelectTrigger className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300">
                              <SelectValue placeholder="所要時間を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110,
                                120, 130, 140, 150, 160, 170, 180,
                              ].map((time) => (
                                <SelectItem key={time} value={time.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-indigo-500" />
                                    {time}分
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AnimatePresence>
                            {errors.timeToMin && (
                              <motion.p
                                {...errorAnimation}
                                className="text-sm mt-1 text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.timeToMin.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>

                      {/* 右側のカラム */}
                      <div className="space-y-6">
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Label className="font-bold flex items-center gap-2">
                            <Camera className="h-4 w-4 text-indigo-600" />
                            メニュー画像
                          </Label>
                          <motion.div
                            className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-dashed border-indigo-200 dark:border-gray-700"
                            whileHover={{
                              boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.3)",
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 10,
                                }}
                              >
                                <FileImage fileId={menu.imgFileId} size={100} />
                              </motion.div>
                              <div className="flex-1">
                                <ImageDrop
                                  onFileSelect={(file: File) =>
                                    setSelectedImgFile(file)
                                  }
                                />
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Label
                              htmlFor="price"
                              className="font-bold flex items-center gap-2"
                            >
                              <DollarSign className="h-4 w-4 text-indigo-600" />
                              通常価格（円）
                            </Label>
                            <Input
                              id="price"
                              {...register("price", {
                                setValueAs: (val) =>
                                  val === "" ? 0 : Number(val),
                              })}
                              aria-invalid={!!errors.price}
                              type="number"
                              placeholder="例：5000"
                              className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                            />
                            <AnimatePresence>
                              {errors.price && (
                                <motion.p
                                  {...errorAnimation}
                                  className="text-sm mt-1 text-red-500 flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.price.message}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Label
                              htmlFor="salePrice"
                              className="font-bold flex items-center gap-2"
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
                              セール価格（円）
                              <AnimatePresence>
                                {discountRate > 0 && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 15,
                                    }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="ml-2 bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                                    >
                                      <FaPercentage className="h-3 w-3" />
                                      {discountRate}%オフ
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Label>
                            <Input
                              id="salePrice"
                              {...register("salePrice", {
                                setValueAs: (val) =>
                                  val === "" ? undefined : Number(val),
                              })}
                              aria-invalid={!!errors.salePrice}
                              type="number"
                              placeholder="例：4000"
                              className="border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                            />
                            <AnimatePresence>
                              {errors.salePrice && (
                                <motion.p
                                  {...errorAnimation}
                                  className="text-sm mt-1 text-red-500 flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.salePrice.message}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      className="pt-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="font-bold flex items-center gap-2"
                        >
                          <Info className="h-4 w-4 text-indigo-600" />
                          メニュー説明
                        </Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          aria-invalid={!!errors.description}
                          placeholder="メニューの詳細説明を入力してください"
                          className="h-32 border-indigo-100 focus-visible:ring-indigo-500 transition-all duration-300"
                        />
                        <AnimatePresence>
                          {errors.description && (
                            <motion.p
                              {...errorAnimation}
                              className="text-sm mt-1 text-red-500 flex items-center gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              {errors.description.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div
                    key="details-tab"
                    {...tabContentAnimation}
                    className="space-y-6"
                  >
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label
                        htmlFor="targetGender"
                        className="font-bold flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-indigo-600" />
                        対象性別
                      </Label>
                      <Select
                        value={selectedTargetGender}
                        onValueChange={(value) => {
                          setSelectedTargetGender(
                            value as "全て" | "男性" | "女性"
                          );
                          setValue(
                            "targetGender",
                            value as "全て" | "男性" | "女性"
                          );
                        }}
                      >
                        <SelectTrigger className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300">
                          <SelectValue placeholder="対象性別を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="全て">
                            <div className="flex items-center gap-2">
                              <FaUsers className="h-3 w-3 text-indigo-500" />
                              全て
                            </div>
                          </SelectItem>
                          <SelectItem value="男性">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-blue-500" />
                              男性
                            </div>
                          </SelectItem>
                          <SelectItem value="女性">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-pink-500" />
                              女性
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {errors.targetGender && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.targetGender.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label
                        htmlFor="staffIds"
                        className="font-bold flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-indigo-600" />
                        対応スタッフ
                      </Label>
                      {salonStaffs?.length === 0 ? (
                        <motion.div
                          className="bg-slate-50 dark:bg-gray-800 p-4 rounded-md border text-sm text-gray-500 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          スタッフが登録されていません
                        </motion.div>
                      ) : (
                        <motion.div
                          className="space-y-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Select
                            value={selectValue}
                            onValueChange={(value) => {
                              setSelectValue(value);
                              handleStaffSelect(value);
                            }}
                          >
                            <SelectTrigger className="border-indigo-100 focus:ring-indigo-500 transition-all duration-300">
                              <SelectValue placeholder="対応スタッフを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                  <FaUsers className="h-3 w-3 text-indigo-500" />
                                  すべて選択
                                </div>
                              </SelectItem>
                              {salonStaffs?.map((staff) => (
                                <SelectItem
                                  key={staff._id}
                                  value={staff._id}
                                  disabled={selectedStaffIds.includes(
                                    staff._id
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-indigo-500" />
                                    {staff.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <AnimatePresence>
                            {selectedStaffIds.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ScrollArea className="h-24 border rounded-md p-2 bg-slate-50 dark:bg-gray-800">
                                  <div className="flex flex-wrap gap-2">
                                    {selectedStaffIds.map((staffId) => {
                                      const staff = salonStaffs?.find(
                                        (s) => s._id === staffId
                                      );
                                      if (!staff) return null;
                                      return (
                                        <motion.div
                                          key={staffId}
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.8 }}
                                          transition={{ duration: 0.2 }}
                                          layout
                                        >
                                          <Badge
                                            variant="secondary"
                                            className="pl-2 pr-1 py-1 flex items-center bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800"
                                          >
                                            <User className="h-3 w-3 mr-1 text-indigo-500" />
                                            {staff.name}
                                            <motion.button
                                              type="button"
                                              onClick={() =>
                                                removeStaff(staffId)
                                              }
                                              className="ml-1 hover:text-red-500 rounded-full p-1 transition-colors duration-200"
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <X className="h-3 w-3" />
                                            </motion.button>
                                          </Badge>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </ScrollArea>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                      <AnimatePresence>
                        {errors.availableStaffIds && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.availableStaffIds.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label
                        htmlFor="couponId"
                        className="font-bold flex items-center gap-2"
                      >
                        <Ticket className="h-4 w-4 text-indigo-600" />
                        クーポンコード設定
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Input
                                {...register("couponId")}
                                placeholder="クーポンIDを入力"
                                className="border-indigo-100 focus-visible:ring-indigo-500 pr-10 transition-all duration-300"
                              />
                              <motion.div
                                whileHover={{ rotate: 15 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 10,
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                              >
                                <Info className="h-4 w-4 text-indigo-400" />
                              </motion.div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              クーポン管理画面で作成したクーポンIDを入力してください
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AnimatePresence>
                        {errors.couponId && (
                          <motion.p
                            {...errorAnimation}
                            className="text-sm mt-1 text-red-500 flex items-center gap-1"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {errors.couponId.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex justify-between gap-4 pt-8 mt-4 border-t"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex gap-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoBack}
                      className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300"
                    >
                      <ArrowLeft className="h-4 w-4" /> 戻る
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="gap-2 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4" /> 削除
                    </Button>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                      >
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </motion.div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSubmitting ? "更新中..." : "メニューを更新"}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
