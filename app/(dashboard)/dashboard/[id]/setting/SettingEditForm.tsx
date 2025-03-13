"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/useZodForm";
import { salonConfigSchema } from "@/lib/validations";
import { Loading } from "@/components/common";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { generateUid } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Save,
  Trash2,
  Info,
  PlusCircle,
  ImageIcon,
  BookOpen,
  Settings,
  Tag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { TIME_TABLES } from "@/lib/constants";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileImage, ImageDrop } from "@/components/common";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
// optionの型定義
type OptionType = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  maxCount?: number | null;
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function SettingPage() {
  const { id } = useParams();
  const [selectedImgFile, setSelectedImgFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLineAccessToken, setShowLineAccessToken] = useState(false);
  const [showLineSecret, setShowLineSecret] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useZodForm(salonConfigSchema, {
    defaultValues: {
      salonId: id as string,
    },
  });

  // 営業開始時間を監視
  const openTime = watch("regularOpenTime");

  // カレンダー表示の制御用状態
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // オプションの状態管理
  const [options, setOptions] = useState<OptionType[]>([]);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState<Omit<OptionType, "id">>({
    name: "",
    price: 0,
    salePrice: null,
    maxCount: null,
  });

  // 日付を文字列 (yyyy-MM-dd) に変換する関数
  const formatDateToString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 日付を表示用にフォーマットする関数
  const formatDateForDisplay = (date: Date): string => {
    return format(date, "yyyy年MM月dd日 (eee)", { locale: ja });
  };

  const createSetting = useMutation(api.salon_config.add);
  const updateSetting = useMutation(api.salon_config.update);
  const existSetting = useQuery(api.salon_config.exist, {
    salonId: id as string,
  });
  const mySettings = useQuery(api.salon_config.getSalonConfig, {
    salonId: id as string,
  });

  // ファイル関連のミューテーション
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const deleteFile = useMutation(api.storage.deleteFile);

  // 固定日付選択用の state
  const [holidayDates, setHolidayDates] = useState<Date[]>([]);

  // オプションを追加する関数
  const handleAddOption = () => {
    if (!newOption.name || newOption.price < 0) {
      toast.error("オプション名と有効な価格を入力してください", {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    const newId = generateUid("salon_option");
    const optionToAdd = {
      id: newId,
      ...newOption,
    };

    setOptions([...options, optionToAdd]);

    // フォームの値も更新
    const formattedOptions = [...options, optionToAdd].map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      salePrice: opt.salePrice || undefined,
      maxCount: opt.maxCount || undefined,
    }));

    setValue("options", formattedOptions);

    // 入力欄をリセット
    setNewOption({
      name: "",
      price: 0,
      salePrice: null,
      maxCount: null,
    });

    // 成功トースト表示
    toast.success("オプションを追加しました", {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  };

  // オプションを削除する関数
  const handleDeleteOption = (id: string) => {
    const updatedOptions = options.filter((opt) => opt.id !== id);
    setOptions(updatedOptions);

    // フォームの値も更新
    const formattedOptions = updatedOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      salePrice: opt.salePrice || undefined,
      maxCount: opt.maxCount || undefined,
    }));

    setValue("options", formattedOptions);

    toast.success("オプションを削除しました", {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  };

  // オプションを編集する関数
  const handleEditOption = (option: OptionType) => {
    setEditingOptionId(option.id);
    setNewOption({
      name: option.name,
      price: option.price,
      salePrice: option.salePrice || null,
      maxCount: option.maxCount || null,
    });
  };

  // オプションの更新を保存する関数
  const handleUpdateOption = () => {
    if (!editingOptionId) return;

    const updatedOptions = options.map((opt) =>
      opt.id === editingOptionId ? { ...opt, ...newOption } : opt
    );

    setOptions(updatedOptions);

    // フォームの値も更新
    const formattedOptions = updatedOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      salePrice: opt.salePrice || undefined,
      maxCount: opt.maxCount || undefined,
    }));

    setValue("options", formattedOptions);

    // 編集モードを終了
    setEditingOptionId(null);
    setNewOption({
      name: "",
      price: 0,
      salePrice: null,
      maxCount: null,
    });

    toast.success("オプションを更新しました", {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    });
  };

  const onSubmit = async (data: z.infer<typeof salonConfigSchema>) => {
    try {
      setIsSaving(true);

      // 画像アップロード処理
      let imageFileId = mySettings?.imgFileId;

      if (selectedImgFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          body: selectedImgFile,
          headers: { "Content-Type": selectedImgFile.type },
        });

        const { storageId } = await result.json();
        imageFileId = storageId;

        // 既存の画像があれば削除
        if (mySettings?.imgFileId) {
          await deleteFile({
            storageId: mySettings.imgFileId,
          });
        }
      }

      const settingData = {
        ...data,
        salonId: id as string,
        imgFileId: imageFileId,
      };

      if (existSetting) {
        await updateSetting(settingData);
      } else {
        await createSetting(settingData);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      toast.success("設定を保存しました", {
        description: "サロン情報が正常に更新されました",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("設定の保存に失敗しました", {
        description: "もう一度お試しいただくか、管理者にお問い合わせください",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveHoliday = (date: Date) => {
    const newDates = holidayDates.filter(
      (d) => formatDateToString(d) !== formatDateToString(date)
    );
    setHolidayDates(newDates);
    setValue("regularHolidays", newDates.map(formatDateToString));
  };

  useEffect(() => {
    if (mySettings) {
      // holidays は mySettings.regularHolidays が文字列の配列で返ってくると仮定し、Date 型に変換する
      const holidaysFromSettings = mySettings.regularHolidays
        ? mySettings.regularHolidays.map((dateStr: string) => new Date(dateStr))
        : [];
      setHolidayDates(holidaysFromSettings);

      // オプションの設定
      if (mySettings.options && Array.isArray(mySettings.options)) {
        const optionsWithIds = mySettings.options.map(
          (opt: {
            name: string;
            price: number;
            salePrice?: number;
            maxCount?: number;
          }) => ({
            id: generateUid("salon_option"),
            ...opt,
          })
        );
        setOptions(optionsWithIds);
      }

      reset({
        salonName: mySettings.salonName,
        email: mySettings.email,
        phone: mySettings.phone,
        address: mySettings.address,
        regularOpenTime: mySettings.regularOpenTime,
        regularCloseTime: mySettings.regularCloseTime,
        regularHolidays: mySettings.regularHolidays,
        description: mySettings.description,
        options: mySettings.options,
        reservationRules: mySettings.reservationRules,
        salonId: id as string,
        lineAccessToken: mySettings.lineAccessToken,
        lineSecret: mySettings.lineSecret,
      });
    }
  }, [mySettings, reset, id]);

  if (!mySettings) {
    return <Loading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg border-none mb-8 overflow-hidden">
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
              <Settings className="h-6 w-6 text-white" />
            </motion.div>
            メニュー編集
          </CardTitle>
          <CardDescription className="text-indigo-100 mt-1">
            メニュー情報を編集して更新してください
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <Tabs
            defaultValue="basic"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="bg-white  mb-8">
              <TabsList className="w-full p-1 bg-gray-50 rounded-t-lg border-b">
                <TabsTrigger
                  value="basic"
                  className={cn(
                    "flex-1 data-[state=active]:shadow-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-bold",
                    "transition-all duration-200 rounded-md flex items-center justify-center gap-2"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  <span>基本情報</span>
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className={cn(
                    "flex-1 data-[state=active]:shadow-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-bold",
                    "transition-all duration-200 rounded-md flex items-center justify-center gap-2"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span>営業時間・定休日</span>
                </TabsTrigger>
                <TabsTrigger
                  value="options"
                  className={cn(
                    "flex-1 data-[state=active]:shadow-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-bold",
                    "transition-all duration-200 rounded-md flex items-center justify-center gap-2"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>サービスオプション</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent
                key="basic-tab"
                value="basic"
                className="space-y-6 mt-0"
              >
                <motion.div
                  key="basic-content"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={staggerContainer}
                >
                  <motion.div variants={slideUp}>
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <ImageIcon className="h-5 w-5" />
                          <span>サロン画像</span>
                        </CardTitle>
                        <CardDescription>
                          サロンの外観や内装の画像を設定します
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-start gap-4">
                          <div className="space-y-2 w-full">
                            <Label className="font-bold text-gray-700">
                              メニュー画像
                            </Label>
                            <div className="flex items-start gap-4 mt-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="rounded-lg w-1/2 flex items-center justify-center overflow-hidden border shadow-sm"
                              >
                                <FileImage
                                  fileId={mySettings?.imgFileId}
                                  size={120}
                                />
                              </motion.div>
                              <div className="flex-1 w-1/2">
                                <ImageDrop
                                  onFileSelect={(file: File) =>
                                    setSelectedImgFile(file)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={slideUp} className="mt-6">
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <Building2 className="h-5 w-5" />
                          <span>サロン基本情報</span>
                        </CardTitle>
                        <CardDescription>
                          お客様に表示される基本的な情報です
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="salonName"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <Building2 className="h-4 w-4 text-indigo-500" />
                              サロン名
                            </Label>
                            <Input
                              id="salonName"
                              {...register("salonName")}
                              placeholder="例: ビューティーサロン ローズ"
                              className={cn(
                                "transition-all duration-200 focus-visible:ring-indigo-500",
                                errors.salonName
                                  ? "border-red-300 focus-visible:ring-red-500"
                                  : "border-gray-200"
                              )}
                            />
                            {errors.salonName && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.salonName.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="email"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <Mail className="h-4 w-4 text-indigo-500" />
                              メールアドレス
                            </Label>
                            <Input
                              id="email"
                              {...register("email")}
                              placeholder="example@salon.com"
                              type="email"
                              className={cn(
                                "transition-all duration-200 focus-visible:ring-indigo-500",
                                errors.email
                                  ? "border-red-300 focus-visible:ring-red-500"
                                  : "border-gray-200"
                              )}
                            />
                            {errors.email && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.email.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="phone"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <Phone className="h-4 w-4 text-indigo-500" />
                              電話番号
                            </Label>
                            <Input
                              id="phone"
                              {...register("phone")}
                              placeholder="03-1234-5678"
                              className={cn(
                                "transition-all duration-200 focus-visible:ring-indigo-500",
                                errors.phone
                                  ? "border-red-300 focus-visible:ring-red-500"
                                  : "border-gray-200"
                              )}
                            />
                            {errors.phone && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.phone.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="address"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <MapPin className="h-4 w-4 text-indigo-500" />
                              住所
                            </Label>
                            <Input
                              id="address"
                              {...register("address")}
                              placeholder="東京都渋谷区〇〇1-2-3"
                              className={cn(
                                "transition-all duration-200 focus-visible:ring-indigo-500",
                                errors.address
                                  ? "border-red-300 focus-visible:ring-red-500"
                                  : "border-gray-200"
                              )}
                            />
                            {errors.address && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.address.message}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={slideUp} className="mt-6">
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <Info className="h-5 w-5" />
                          <span>サロン詳細情報</span>
                        </CardTitle>
                        <CardDescription>
                          サロンについての説明文を入力してください
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="description"
                            className="flex items-center gap-2 text-gray-700"
                          >
                            サロンの説明
                          </Label>
                          <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="サロンの特徴やサービス内容、こだわりなどをご記入ください"
                            className={cn(
                              "min-h-32 transition-all duration-200 focus-visible:ring-indigo-500",
                              errors.description
                                ? "border-red-300 focus-visible:ring-red-500"
                                : "border-gray-200"
                            )}
                          />
                          {errors.description && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="text-red-500 text-sm flex items-center gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              {errors.description.message}
                            </motion.p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent
                key="schedule-tab"
                value="schedule"
                className="space-y-6 mt-0"
              >
                <motion.div
                  key="schedule-content"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={staggerContainer}
                >
                  <motion.div variants={slideUp}>
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <Clock className="h-5 w-5" />
                          <span>営業時間</span>
                        </CardTitle>
                        <CardDescription>
                          通常の営業時間を設定してください
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="regularOpenTime"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <Clock className="h-4 w-4 text-indigo-500" />
                              営業開始時間
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setValue("regularOpenTime", value)
                              }
                              defaultValue={mySettings?.regularOpenTime}
                            >
                              <SelectTrigger
                                className={cn(
                                  "transition-all duration-200 focus:ring-indigo-500",
                                  errors.regularOpenTime
                                    ? "border-red-300"
                                    : "border-gray-200"
                                )}
                              >
                                <SelectValue placeholder="営業開始時間を選択" />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {TIME_TABLES.map((time, index) => (
                                  <SelectItem
                                    key={`open-time-${index}-${time}`}
                                    value={time}
                                  >
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.regularOpenTime && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.regularOpenTime.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="regularCloseTime"
                              className="flex items-center gap-2 text-gray-700"
                            >
                              <Clock className="h-4 w-4 text-indigo-500" />
                              閉店時間
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setValue("regularCloseTime", value)
                              }
                              defaultValue={mySettings?.regularCloseTime}
                            >
                              <SelectTrigger
                                className={cn(
                                  "transition-all duration-200 focus:ring-indigo-500",
                                  errors.regularCloseTime
                                    ? "border-red-300"
                                    : "border-gray-200"
                                )}
                              >
                                <SelectValue placeholder="閉店時間を選択" />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {TIME_TABLES.filter((time) => {
                                  if (openTime) {
                                    return time > openTime;
                                  }
                                  return true;
                                }).map((time, index) => (
                                  <SelectItem
                                    key={`close-time-${index}-${time}`}
                                    value={time}
                                  >
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.regularCloseTime && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.regularCloseTime.message}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={slideUp} className="mt-6">
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <Calendar className="h-5 w-5" />
                          <span>定休日設定</span>
                        </CardTitle>
                        <CardDescription>
                          カレンダーから定休日を選択してください
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Popover
                                        open={isCalendarOpen}
                                        onOpenChange={setIsCalendarOpen}
                                      >
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full justify-start bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200"
                                          >
                                            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                                            {holidayDates.length > 0
                                              ? `${holidayDates.length}日選択済み`
                                              : "定休日を選択"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="p-0 w-auto border-gray-200 shadow-lg"
                                          align="start"
                                        >
                                          <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <div className="border-b p-3 flex justify-between items-center bg-gray-50">
                                              <h4 className="font-medium text-sm text-gray-700">
                                                定休日選択
                                              </h4>
                                              <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() =>
                                                  setIsCalendarOpen(false)
                                                }
                                              >
                                                確定
                                              </Button>
                                            </div>
                                            <CalendarComponent
                                              mode="multiple"
                                              selected={holidayDates}
                                              onSelect={(dates) => {
                                                if (dates) {
                                                  setHolidayDates(dates);
                                                  setValue(
                                                    "regularHolidays",
                                                    dates.map(
                                                      formatDateToString
                                                    )
                                                  );
                                                }
                                              }}
                                              locale={ja}
                                              className="rounded-md"
                                            />
                                          </motion.div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>クリックして定休日を選択</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-700">
                                選択中の定休日
                              </h4>
                              <Badge
                                variant="outline"
                                className="bg-indigo-50 text-indigo-600 border-indigo-200"
                              >
                                {holidayDates.length}日
                              </Badge>
                            </div>
                            <div className="border rounded-lg p-4 bg-gray-50 min-h-24">
                              <AnimatePresence>
                                {holidayDates.length > 0 ? (
                                  <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={staggerContainer}
                                    className="flex flex-wrap gap-2"
                                  >
                                    {holidayDates.map((date, index) => (
                                      <motion.div
                                        key={`holiday-date-${index}-${date ? date.toISOString() : `no-date-${index}`}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{
                                          opacity: 0,
                                          scale: 0.8,
                                          transition: { duration: 0.2 },
                                        }}
                                        className="flex items-center gap-2 rounded-full bg-white border px-3 py-1 shadow-sm"
                                      >
                                        <span className="text-sm">
                                          {formatDateForDisplay(date)}
                                        </span>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 rounded-full p-0 hover:bg-red-50 hover:text-red-500"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent className="border-gray-200">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                定休日の削除
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {formatDateForDisplay(date)}
                                                を定休日から削除しますか？
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel className="border-gray-200">
                                                キャンセル
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleRemoveHoliday(date)
                                                }
                                                className="bg-red-500 hover:bg-red-600 text-white"
                                              >
                                                削除する
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center h-full text-gray-500"
                                  >
                                    定休日は選択されていません
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent
                key="options-tab"
                value="options"
                className="space-y-6 mt-0"
              >
                <motion.div
                  key="options-content"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={staggerContainer}
                >
                  <motion.div variants={slideUp}>
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <Tag className="h-5 w-5" />
                          <span>サービスオプション</span>
                        </CardTitle>
                        <CardDescription>
                          メニューに追加できるオプションを設定します
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="optionName"
                                className="text-gray-700"
                              >
                                オプション名
                              </Label>
                              <Input
                                id="optionName"
                                value={newOption.name}
                                onChange={(e) =>
                                  setNewOption({
                                    ...newOption,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="例: シャンプー"
                                className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="optionPrice"
                                className="text-gray-700"
                              >
                                価格 (円)
                              </Label>
                              <Input
                                id="optionPrice"
                                type="number"
                                value={newOption.price}
                                onChange={(e) =>
                                  setNewOption({
                                    ...newOption,
                                    price: Number(e.target.value),
                                  })
                                }
                                placeholder="1000"
                                className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="optionSalePrice"
                                className="text-gray-700"
                              >
                                セール価格 (円・任意)
                              </Label>
                              <Input
                                id="optionSalePrice"
                                type="number"
                                value={newOption.salePrice || ""}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value);
                                  setNewOption({
                                    ...newOption,
                                    salePrice: val,
                                  });
                                }}
                                placeholder="800"
                                className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="optionMaxCount"
                                className="text-gray-700"
                              >
                                最大数 (任意)
                              </Label>
                              <Input
                                id="optionMaxCount"
                                type="number"
                                value={newOption.maxCount || ""}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value);
                                  setNewOption({ ...newOption, maxCount: val });
                                }}
                                placeholder="5"
                                className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            {editingOptionId ? (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-gray-200"
                                  onClick={() => {
                                    setEditingOptionId(null);
                                    setNewOption({
                                      name: "",
                                      price: 0,
                                      salePrice: null,
                                      maxCount: null,
                                    });
                                  }}
                                >
                                  キャンセル
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleUpdateOption}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  更新する
                                </Button>
                              </div>
                            ) : (
                              <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <Button
                                  type="button"
                                  onClick={handleAddOption}
                                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                                >
                                  <PlusCircle className="h-4 w-4" />
                                  オプションを追加
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">
                              登録済みオプション
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-600 border-indigo-100"
                            >
                              {options.length}件
                            </Badge>
                          </div>

                          <div className="border rounded-md overflow-hidden shadow-sm">
                            <ScrollArea className="h-64">
                              <AnimatePresence>
                                {options.length > 0 ? (
                                  <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={staggerContainer}
                                    className="p-4 space-y-3"
                                  >
                                    {options.map((option, index) => (
                                      <motion.div
                                        key={`option-${index}-${option.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                          "flex items-center justify-between p-3 ",
                                          "hover:bg-gray-50 transition-colors duration-200",
                                          index !== options.length - 1
                                            ? "border-b"
                                            : ""
                                        )}
                                      >
                                        <div className="space-y-1">
                                          <h4 className="font-semibold">
                                            {option.name}
                                          </h4>
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium  text-gray-900">
                                              {option.price.toLocaleString()}円
                                            </span>
                                            {option.salePrice && (
                                              <Badge
                                                variant="outline"
                                                className="bg-red-50 text-red-600 border-red-100"
                                              >
                                                セール:{" "}
                                                {option.salePrice.toLocaleString()}
                                                円
                                              </Badge>
                                            )}
                                            {option.maxCount && (
                                              <Badge
                                                variant="outline"
                                                className="bg-gray-100 border-gray-200"
                                              >
                                                最大: {option.maxCount}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleEditOption(option)
                                            }
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                          >
                                            編集
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                              >
                                                削除
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="border-gray-200">
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  オプションの削除
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  「{option.name}
                                                  」を削除しますか？この操作は元に戻せません。
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel className="border-gray-200">
                                                  キャンセル
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleDeleteOption(
                                                      option.id
                                                    )
                                                  }
                                                  className="bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                  削除する
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-64 p-4 text-gray-500 gap-2"
                                  >
                                    <Tag className="h-8 w-8 text-gray-300" />
                                    <p>オプションが登録されていません</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 border-gray-200"
                                      onClick={() => {
                                        document
                                          .getElementById("optionName")
                                          ?.focus();
                                      }}
                                    >
                                      <PlusCircle className="mr-2 h-3 w-3" />
                                      オプションを追加する
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </ScrollArea>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={slideUp} className="mt-6">
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <BookOpen className="h-5 w-5" />
                          <span>LINE連携設定</span>
                        </CardTitle>
                        <CardDescription>
                          LINE公式アカウント連携の設定をします
                          <p className="text-xs mt-1 p-2 bg-white rounded-md text-center text-green-600">
                            こちらを設定して頂くと自身の公式ラインから予約の通知を送信できます。
                          </p>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="lineAccessToken"
                            className="text-gray-700"
                          >
                            LINEチャネルアクセストークン
                          </Label>
                          <div className="relative">
                            <Input
                              id="lineAccessToken"
                              type={showLineAccessToken ? "text" : "password"}
                              {...register("lineAccessToken")}
                              placeholder="LINE Channel Access Token"
                              className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() =>
                                setShowLineAccessToken(!showLineAccessToken)
                              }
                              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                            >
                              {showLineAccessToken ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <Label htmlFor="lineSecret" className="text-gray-700">
                            LINEチャネルシークレット
                          </Label>
                          <div className="relative">
                            <Input
                              id="lineSecret"
                              type={showLineSecret ? "text" : "password"}
                              {...register("lineSecret")}
                              placeholder="LINE Channel Secret"
                              className="border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setShowLineSecret(!showLineSecret)}
                              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                            >
                              {showLineSecret ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2 mb-4">
                          <Info className="h-3 w-3" />
                          チャネルアクセストークンとチャネルシークレットはLINE公式アカウントの設定画面から取得できます。
                        </p>
                        <Link
                          href="#"
                          target="_blank"
                          className="text-xs text-blue-600 flex items-center gap-1 mt-2 underline "
                        >
                          公式アカウントとの連携方法はこちら
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                        <a
                          href="mailto:atk721@icloud.com"
                          target="_blank"
                          className=" text-xs text-blue-600 flex items-center gap-1 mt-2 underline "
                        >
                          LINEの設定が難しい場合はお気軽にお問い合わせください
                          <Mail className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={slideUp} className="mt-6">
                    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                          <BookOpen className="h-5 w-5" />
                          <span>予約ルール</span>
                        </CardTitle>
                        <CardDescription>
                          予約に関するルールや注意事項を設定します
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="reservationRules"
                            className="text-gray-700"
                          >
                            予約ルール
                          </Label>
                          <Textarea
                            id="reservationRules"
                            {...register("reservationRules")}
                            placeholder="例: 予約は3日前までにお願いします。当日キャンセルは50%のキャンセル料が発生します。"
                            className="min-h-32 border-gray-200 focus-visible:ring-indigo-500 transition-all duration-200"
                          />
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Info className="h-3 w-3" />
                            お客様に表示される予約に関するルールや注意事項を入力してください。
                            HTMLタグは使用できません。
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <motion.div
            className="mt-8 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={isSubmitting || isSaving}
                className={cn(
                  "gap-2 px-6 py-2 h-12 font-medium text-white transition-all duration-300",
                  "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600",
                  "shadow-md hover:shadow-lg"
                )}
              >
                {isSubmitting || isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  <>
                    {saveSuccess ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {saveSuccess ? "保存しました！" : "設定を保存"}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </Card>
    </motion.div>
  );
}
