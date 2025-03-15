"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loading } from "@/components/common";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Save,
  Calendar,
  Pencil,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useZodForm } from "@/hooks/useZodForm";
import { customerEditSchema } from "@/lib/validations";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { handleErrorToMessage } from "@/lib/errors";
export default function CustomerEditForm() {
  const { customer_id, id } = useParams();
  const router = useRouter();
  const [isEditingFullName, setIsEditingFullName] = useState(false);

  // 顧客データの取得
  const customer = useQuery(api.customer.getCustomerById, {
    id: customer_id as Id<"customer">,
  });

  // フォームの初期化
  const form = useZodForm(customerEditSchema, {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // 顧客データが読み込まれたらフォームの値を設定
  useEffect(() => {
    if (customer) {
      form.reset({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
    }
  }, [customer, form]);

  // 顧客更新のミューテーション (プレースホルダー)
  const updateCustomer = useMutation(api.customer.update);

  // フォーム送信ハンドラ
  const onSubmit = async (data: z.infer<typeof customerEditSchema>) => {
    try {
      // ここで実際の更新処理を呼び出す
      await updateCustomer({
        id: customer_id as Id<"customer">,
        email: data.email || "",
        phone: data.phone || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        lineId: customer?.lineId || "",
        lineUserName: customer?.lineUserName || "",
      });

      // 成功メッセージを表示
      toast.success("顧客情報が正常に更新されました", {
        duration: 3000,
        position: "top-center",
      });
      router.push(`/dashboard/${id}/customer/${customer_id}/detail`);
    } catch (error) {
      const errorMessage = handleErrorToMessage(error);
      toast.error(errorMessage);
    }
  };

  // ローディング状態の表示
  if (!customer) {
    return <Loading />;
  }

  // 顧客名の表示用
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
  const displayName = customer.lineUserName || fullName || "顧客名未設定";

  // イニシャルを取得する関数
  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  };

  // アニメーション設定
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto  px-4 md:px-0 "
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* プロフィールサイドバー */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="overflow-hidden border-2 border-muted hover:border-muted-foreground/20 transition-colors duration-300">
            <CardHeader className="text-center relative pb-3">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 absolute top-0 left-0 right-0 h-20 -z-10" />
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-lg">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="group relative">
                <CardTitle className="text-2xl break-all transition-opacity duration-300">
                  {displayName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingFullName(!isEditingFullName)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">名前を編集</span>
                </Button>
              </div>

              <CardDescription className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                  ID: {customer._id}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <motion.div
                className="text-sm space-y-2 mb-4"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    登録日:{" "}
                    {new Date(customer._creationTime).toLocaleDateString(
                      "ja-JP"
                    )}
                  </span>
                </div>

                {customer.lineId && (
                  <div className="flex items-center text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <Badge className="flex items-center gap-1 text-white bg-green-500 hover:bg-green-600">
                      LINE連携済み
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 ml-1 text-white" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">
                              LINE ID: {customer.lineId}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Badge>
                  </div>
                )}
              </motion.div>

              <div className="bg-muted p-3 rounded-md text-xs">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">編集のヒント</p>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>メールアドレスは正しいフォーマットで入力してください</li>
                  <li>電話番号は市外局番から入力してください</li>
                  <li>LINE IDは直接編集できません</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 編集フォーム */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="border-2 border-muted shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  顧客情報の編集
                </CardTitle>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5"
                >
                  データ編集中
                </motion.div>
              </div>
              <CardDescription>
                以下のフォームで顧客情報を更新できます
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                id="customer-edit-form"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 姓 */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center">
                      姓
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="姓"
                      {...form.register("firstName")}
                      className={`transition-all duration-300 ${
                        form.formState.errors.firstName
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "focus-visible:ring-primary"
                      }`}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  {/* 名 */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center">
                      名
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="名"
                      {...form.register("lastName")}
                      className={`transition-all duration-300 ${
                        form.formState.errors.lastName
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "focus-visible:ring-primary"
                      }`}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-red-500 text-xs">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="bg-muted/70" />

                {/* メールアドレス */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    メールアドレス
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.com"
                    {...form.register("email")}
                    className={`transition-all duration-300 ${
                      form.formState.errors.email
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "focus-visible:ring-primary"
                    }`}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* 電話番号 */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    電話番号
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="03-XXXX-XXXX"
                    {...form.register("phone")}
                    className={`transition-all duration-300 ${
                      form.formState.errors.phone
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "focus-visible:ring-primary"
                    }`}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-xs">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                {/* 読み取り専用フィールド */}
                <div className="space-y-4 bg-muted/50 p-4 rounded-md">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      LINE ID (編集不可)
                    </Label>
                    <Input
                      value={customer.lineId || "未連携"}
                      disabled
                      className="bg-muted cursor-not-allowed opacity-70"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">
                      サロンID (編集不可)
                    </Label>
                    <Input
                      value={customer.salonId}
                      disabled
                      className="bg-muted cursor-not-allowed opacity-70 font-mono text-xs"
                    />
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col sm:flex-row gap-4 sm:justify-between border-t bg-muted/20">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/${id}/customer/${customer_id}/detail`)
                }
                className="w-full sm:w-auto group"
              >
                <ChevronLeft className="mr-2 h-4 w-4 group-hover:scale-125 transition-transform" />
                詳細ページへ
              </Button>
              <Button
                type="submit"
                form="customer-edit-form"
                className="w-full sm:w-auto group relative overflow-hidden"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-primary/20"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1 }}
                    />
                    <span className="animate-pulse">更新中...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                    変更を保存
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
