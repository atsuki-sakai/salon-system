"use client";

import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/useZodForm";
import { salonConfigSchema } from "@/lib/validations";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
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
import { FileImage } from "@/components/common";

// optionの型定義
type OptionType = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  maxCount?: number | null;
};

export default function SettingPage() {
  const { id } = useParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
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

  // 画像アップロード用のref
  const imageFileRef = useRef<HTMLInputElement>(null);

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

  // ランダムなIDを生成する関数
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // オプションを追加する関数
  const handleAddOption = () => {
    if (!newOption.name || newOption.price < 0) {
      toast.error("オプション名と有効な価格を入力してください");
      return;
    }

    const newId = generateId();
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
  };

  const onSubmit = async (data: z.infer<typeof salonConfigSchema>) => {
    try {
      // 画像アップロード処理
      let imageFileId = mySettings?.imgFileId;

      if (
        imageFileRef.current?.files &&
        imageFileRef.current.files.length > 0
      ) {
        const file = imageFileRef.current.files[0];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (file && file.size > maxSize) {
          toast.error(
            "ファイルサイズが大きすぎます。2MB以下の画像をアップロードしてください。"
          );
          return;
        }

        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file ? file.type : "image/*" },
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
      toast.success("設定を保存しました", {
        description: "サロン情報が正常に更新されました",
        icon: "✅",
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("設定の保存に失敗しました", {
        description: "もう一度お試しいただくか、管理者にお問い合わせください",
        icon: "❌",
      });
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
            id: generateId(),
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
      });
    }
  }, [mySettings, reset, id]);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">サロン設定</h1>
        {isDirty && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-600 border-amber-200"
          >
            変更未保存
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>基本情報</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>営業時間・定休日</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>サービスオプション</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span>サロン画像</span>
                </CardTitle>
                <CardDescription>
                  サロンの外観や内装の画像を設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-32 min-h-32 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {mySettings?.imgFileId ? (
                      <FileImage
                        fileId={mySettings.imgFileId}
                        alt="サロン画像"
                        size={128}
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="salonImage"
                        className="font-medium text-sm"
                      >
                        サロン画像をアップロード
                      </Label>
                      <Input
                        id="salonImage"
                        type="file"
                        ref={imageFileRef}
                        accept="image/*"
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">
                        JPG、PNG形式、2MB以下のファイルをアップロードしてください
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span>サロン基本情報</span>
                </CardTitle>
                <CardDescription>
                  お客様に表示される基本的な情報です
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="salonName"
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-gray-500" />
                    サロン名
                  </Label>
                  <Input
                    id="salonName"
                    {...register("salonName")}
                    placeholder="例: ビューティーサロン ローズ"
                    className={errors.salonName ? "border-red-500" : ""}
                  />
                  {errors.salonName && (
                    <p className="text-red-500 text-sm">
                      {errors.salonName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    メールアドレス
                  </Label>
                  <Input
                    id="email"
                    {...register("email")}
                    placeholder="example@salon.com"
                    type="email"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    電話番号
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="03-1234-5678"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    住所
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="東京都渋谷区〇〇1-2-3"
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  <span>サロン詳細情報</span>
                </CardTitle>
                <CardDescription>
                  サロンについての説明文を入力してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-2"
                  >
                    サロンの説明
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="サロンの特徴やサービス内容、こだわりなどをご記入ください"
                    className="min-h-32"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>営業時間</span>
                </CardTitle>
                <CardDescription>
                  通常の営業時間を設定してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="regularOpenTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-gray-500" />
                      営業開始時間
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("regularOpenTime", value)
                      }
                      defaultValue={mySettings?.regularOpenTime}
                    >
                      <SelectTrigger
                        className={
                          errors.regularOpenTime ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="営業開始時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_TABLES.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.regularOpenTime && (
                      <p className="text-red-500 text-sm">
                        {errors.regularOpenTime.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="regularCloseTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-gray-500" />
                      閉店時間
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("regularCloseTime", value)
                      }
                      defaultValue={mySettings?.regularCloseTime}
                    >
                      <SelectTrigger
                        className={
                          errors.regularCloseTime ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="閉店時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_TABLES.filter((time) => {
                          if (openTime) {
                            return time > openTime;
                          }
                          return true;
                        }).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.regularCloseTime && (
                      <p className="text-red-500 text-sm">
                        {errors.regularCloseTime.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>定休日設定</span>
                </CardTitle>
                <CardDescription>
                  カレンダーから定休日を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2">
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-white hover:bg-gray-50"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {holidayDates.length > 0
                              ? `${holidayDates.length}日選択済み`
                              : "定休日を選択"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto" align="start">
                          <div className="border-b p-3 flex justify-between items-center">
                            <h4 className="font-medium text-sm">定休日選択</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsCalendarOpen(false)}
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
                                  dates.map(formatDateToString)
                                );
                              }
                            }}
                            locale={ja}
                            className="rounded-md"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">選択中の定休日</h4>
                    <div className="border rounded-lg p-4 bg-gray-50 min-h-24">
                      {holidayDates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {holidayDates.map((date) => (
                            <div
                              key={date.toISOString()}
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
                                <AlertDialogContent>
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
                                    <AlertDialogCancel>
                                      キャンセル
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveHoliday(date)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      削除する
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          定休日は選択されていません
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="options" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  <span>サービスオプション</span>
                </CardTitle>
                <CardDescription>
                  メニューに追加できるオプションを設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionName">オプション名</Label>
                      <Input
                        id="optionName"
                        value={newOption.name}
                        onChange={(e) =>
                          setNewOption({ ...newOption, name: e.target.value })
                        }
                        placeholder="例: シャンプー"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="optionPrice">価格 (円)</Label>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="optionSalePrice">
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
                          setNewOption({ ...newOption, salePrice: val });
                        }}
                        placeholder="800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="optionMaxCount">最大数 (任意)</Label>
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
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {editingOptionId ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
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
                        <Button type="button" onClick={handleUpdateOption}>
                          更新する
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleAddOption}
                        className="flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        オプションを追加
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">登録済みオプション</h3>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600"
                    >
                      {options.length}件
                    </Badge>
                  </div>

                  <ScrollArea className="h-64 border rounded-md">
                    {options.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                          >
                            <div className="space-y-1">
                              <h4 className="font-medium">{option.name}</h4>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-900">
                                  {option.price.toLocaleString()}円
                                </span>
                                {option.salePrice && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-600"
                                  >
                                    セール: {option.salePrice.toLocaleString()}
                                    円
                                  </Badge>
                                )}
                                {option.maxCount && (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-100"
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
                                onClick={() => handleEditOption(option)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
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
                                <AlertDialogContent>
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
                                    <AlertDialogCancel>
                                      キャンセル
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteOption(option.id)
                                      }
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      削除する
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full p-4 text-gray-500">
                        オプションが登録されていません
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>予約ルール</span>
                </CardTitle>
                <CardDescription>
                  予約に関するルールや注意事項を設定します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="reservationRules">予約ルール</Label>
                  <Textarea
                    id="reservationRules"
                    {...register("reservationRules")}
                    placeholder="例: 予約は3日前までにお願いします。当日キャンセルは50%のキャンセル料が発生します。"
                    className="min-h-32"
                  />
                  <p className="text-xs text-gray-500">
                    お客様に表示される予約に関するルールや注意事項を入力してください。
                    HTMLタグは使用できません。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
            size="lg"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}