"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loading } from "@/components/common";
// 顧客プロフィールコンポーネント
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function CustomerDetailCard() {
  const { customer_id } = useParams();
  const customer = useQuery(api.customer.getCustomerById, {
    id: customer_id as Id<"customer">,
  });

  if (!customer) {
    return <Loading />;
  }

  return <CustomerProfile customer={customer} />;
}

function CustomerProfile({ customer }: { customer: Doc<"customer"> }) {
  const fullName =
    `${customer.firstName} ${customer.lastName}`.trim() || "名前未設定";
  const creationDate = new Date(customer._creationTime).toLocaleDateString(
    "ja-JP",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const accessToken = useQuery(api.salon_config.getLineAccessToken, {
    salonId: customer?.salonId as Id<"salon">,
  });

  // メッセージ送信用のステート
  const [isLineMessageDialogOpen, setIsLineMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // イニシャルを取得する関数
  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  };

  // LINEメッセージを送信する関数
  const sendLineMessage = async () => {
    if (!customer.lineId) {
      toast.error(
        "LINE IDが設定されていません。先にLINE連携を行ってください。"
      );
      return;
    }

    if (!messageText.trim()) {
      toast.error("メッセージを入力してください。");
      return;
    }

    try {
      setIsSending(true);

      const response = await fetch("/api/line/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineId: customer.lineId,
          message: messageText,
          accessToken: accessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("メッセージが送信されました");
        setMessageText("");
        setIsLineMessageDialogOpen(false);
      } else {
        throw new Error(result.error || "メッセージ送信に失敗しました");
      }
    } catch (error) {
      console.error("LINE message sending error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "メッセージ送信中にエラーが発生しました"
      );
    } finally {
      setIsSending(false);
    }
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
      },
    },
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto  px-4 md:px-0"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {/* プロフィールカード */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(customer.lineUserName || fullName)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">
                  {customer.lineUserName || fullName}
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-2">
                    登録日: {creationDate}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || "未設定"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone || "未設定"}</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mr-2" />
                  <div
                    className="flex items-center justify-center gap-2"
                    title={customer.lineId}
                  >
                    <p className="text-sm">LINE</p>
                    {customer.lineId ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500 text-white flex items-center justify-center"
                      >
                        <CheckCircle className="h-3 w-3 text-white mr-1" />
                        連携済み
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-200 text-gray-700"
                      >
                        未連携
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="px-6 py-2 text-sm "
                >
                  <Link
                    href={`/dashboard/${customer.salonId}/customer/${customer._id}/edit`}
                  >
                    編集
                  </Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-sm px-6 py-2"
                  onClick={() => setIsLineMessageDialogOpen(true)}
                  disabled={!customer.lineId}
                >
                  LINEでメッセージ
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* 詳細情報 */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>顧客詳細情報</CardTitle>
                <CardDescription>この顧客に関するすべての情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      姓
                    </h3>
                    <p className="text-lg">{customer.firstName || "未設定"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      名
                    </h3>
                    <p className="text-lg">{customer.lastName || "未設定"}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    顧客ID
                  </h3>
                  <p className="text-sm font-mono break-all">{customer._id}</p>
                </div>
                {customer.lineId && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      LINE ID
                    </h3>
                    <p className="text-sm font-mono break-all">
                      {customer.lineId}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    過去の利用履歴
                  </h3>
                  <ul className="flex flex-col gap-2 bg-gray-100 p-4 rounded-md">
                    <li className="flex items-center gap-2 text-sm">
                      <p>2025/01/01</p>
                      <p>10:00</p>
                      <p>ヘアカット</p>
                      <p>1000円</p>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* LINEメッセージ送信ダイアログ */}
      <Dialog
        open={isLineMessageDialogOpen}
        onOpenChange={setIsLineMessageDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>LINEメッセージを送信</DialogTitle>
            <DialogDescription>
              {customer.lineUserName || fullName}
              さんにLINEでメッセージを送信します。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="メッセージを入力してください"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[100px]"
            />
            {!customer.lineId && (
              <div className="flex items-center mt-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>
                  LINE IDが設定されていません。先にLINE連携を行ってください。
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLineMessageDialogOpen(false)}
              disabled={isSending}
            >
              キャンセル
            </Button>
            <Button
              onClick={sendLineMessage}
              disabled={isSending || !customer.lineId || !messageText.trim()}
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
