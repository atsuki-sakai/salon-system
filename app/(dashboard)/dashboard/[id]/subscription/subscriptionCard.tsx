"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSalonCore } from "@/hooks/useSalonCore";
import {
  Check,
  CreditCard,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Scissors,
} from "lucide-react";
import { FaSpa, FaCalendarCheck, FaUsersCog } from "react-icons/fa";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

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
  visible: { y: 0, opacity: 1 },
};

const features = [
  {
    icon: <FaCalendarCheck className="w-4 h-4" />,
    text: "予約カレンダーを作成、編集できます。",
  },
  {
    icon: <Scissors className="w-4 h-4" />,
    text: "カットメニューを作成、編集できます。",
  },
  {
    icon: <FaUsersCog className="w-4 h-4" />,
    text: "スタッフ毎の予約カレンダーを作成、編集できます。",
  },
  {
    icon: <FaSpa className="w-4 h-4" />,
    text: "スタッフ毎のカットメニューを作成、編集できます。",
  },
];

const benefits = [
  {
    icon: <Clock className="w-4 h-4" />,
    text: "時間の節約",
  },
  {
    icon: <Shield className="w-4 h-4" />,
    text: "安全なデータ管理",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "顧客満足度の向上",
  },
];

export default function SubscriptionCard() {
  const { salonCore, isLoading } = useSalonCore();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSession = useAction(api.subscription.createSubscriptionSession);
  const createBillingPortal = useAction(
    api.subscription.createBillingPortalSession
  );

  const handleSubscribe = async () => {
    if (isLoading) {
      setError("ユーザー情報の読み込み中です");
      return;
    }

    if (!salonCore?.stripeCustomerId) {
      setError("Stripeの顧客情報が見つかりません");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Creating subscription for user:", salonCore?.clerkId);
      const result = await createSession({
        stripeCustomerId: salonCore.stripeCustomerId,
        clerkUserId: salonCore?.clerkId ?? "",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
        baseUrl: process.env.NEXT_PUBLIC_URL!,
      });

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
      toast.success("サブスクリプションの更新が完了しました");
    } catch (err: unknown) {
      console.error("Subscription error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("サブスクリプションの開始に失敗しました。");
      }
      toast.error("サブスクリプションの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      setIsSubmitting(true);
      console.log("Stripe Customer ID:", salonCore?.stripeCustomerId);

      // Billing Portal セッションを作成する
      const result = await createBillingPortal({
        customerId: salonCore?.stripeCustomerId ?? "",
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/${salonCore?.clerkId}`,
      });

      // 返却された portalUrl を使ってリダイレクト
      if (result?.portalUrl) {
        window.location.href = result.portalUrl;
      } else {
        console.error("Billing Portal の URL が取得できませんでした。");
        setError("請求ポータルの取得に失敗しました。");
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      setError("請求ポータルへのアクセスに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-20vh)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
          Booker Pro
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto text-sm">
          予約管理とスタッフ管理を効率化し、
          <br />
          サロンビジネスを次のレベルへ
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-800 relative">
          {/* トップグラデーション */}
          <div className="absolute h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 top-0 left-0 right-0"></div>

          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                サブスクリプション
              </CardTitle>
              {salonCore?.subscriptionStatus === "active" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                >
                  <Badge
                    variant="default"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    アクティブ
                  </Badge>
                </motion.div>
              )}
            </div>
            <CardDescription>
              サロン運営に必要な全機能をご利用いただけます
            </CardDescription>
          </CardHeader>

          {salonCore?.subscriptionStatus === "active" ? (
            <CardContent className="pt-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg mb-6"
              >
                <div className="bg-white dark:bg-green-800/30 rounded-full p-3 mb-2 shadow-md">
                  <Check className="w-8 h-8 text-green-500 dark:text-green-300" />
                </div>
                <p className="text-center text-xl font-bold text-green-700 dark:text-green-300">
                  サブスクリプション加入済み
                </p>
                <p className="text-center text-sm text-green-600 dark:text-green-400">
                  全ての機能を利用できます
                </p>
              </motion.div>

              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={itemVariants}
                  className="text-sm text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg"
                >
                  <p className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    以下のリンクから請求書や納品書をダウンロードできます。
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    サブスクリプションを確認するには、以下のボタンをクリックしてください。
                  </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    onClick={handleBillingPortal}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        読み込み中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        サブスクリプションを確認する
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          ) : (
            <CardContent className="pt-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg mb-6 text-center"
              >
                <div className="bg-white dark:bg-blue-800/30 rounded-full p-3 mb-3 inline-block shadow-md">
                  <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    10,000
                  </span>
                  <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
                    円/月
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  サブスクリプションに加入すると、全機能をご利用いただけます。
                </p>
              </motion.div>

              <Separator className="my-4" />

              <motion.div
                className="space-y-4 my-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h3
                  variants={itemVariants}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  含まれる機能:
                </motion.h3>
                <motion.ul
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  variants={containerVariants}
                >
                  {features.map((feature, index) => (
                    <motion.li
                      key={`features-${index}`}
                      variants={itemVariants}
                      className="flex items-center  gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-sm">
                        {feature.icon}
                      </div>
                      <div>{feature.text}</div>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div variants={containerVariants} className="mt-6">
                  <motion.h3
                    variants={itemVariants}
                    className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    ビジネスメリット:
                  </motion.h3>

                  <motion.div
                    className="flex justify-between gap-2"
                    variants={containerVariants}
                  >
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={`benefit-${index}`}
                        variants={itemVariants}
                        className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg flex-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2 shadow-sm">
                          {benefit.icon}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {benefit.text}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Button
                  onClick={handleSubscribe}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">処理中...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      今すぐ加入する
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          )}

          <CardFooter className="pt-2 pb-6 px-6 text-xs text-slate-500 dark:text-slate-400 text-center">
            <p>安全な決済処理。いつでもキャンセル可能です。</p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
