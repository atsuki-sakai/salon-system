"use client";

import Link from "next/link";
import { useSalonCore } from "@/hooks/useSalonCore";
import Loading from "@/components/common/Loading";
import {
  XCircle,
  Mail,
  CreditCard,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export default function CancelSubscriptionPage() {
  const { salonCore, isLoading } = useSalonCore();

  if (isLoading) {
    return <Loading />;
  }

  // アニメーション設定
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-[calc(100vh-20vh)] flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        className="w-full max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500"></div>
          <CardContent className="pt-10 pb-6 px-8">
            <motion.div
              className="text-center space-y-6"
              variants={containerVariants}
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30"
              >
                <XCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                  サブスクリプションの購入に失敗しました
                </h2>
              </motion.div>

              <Separator className="my-6" />

              <motion.div variants={itemVariants} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-3 text-left">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          再度サブスクリプションを購入する
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          以下のリンクから再度サブスクリプションを購入できます。
                        </p>
                        <Button
                          asChild
                          variant="link"
                          className="p-0 h-auto mt-1 text-blue-500 hover:text-blue-600 font-medium"
                        >
                          <Link
                            href={`/dashboard/${salonCore?.salonId}/subscription`}
                          >
                            <span className="flex items-center">
                              サブスクリプションページへ
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row items-center gap-3 text-left">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          サポートに問い合わせる
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          何かご不明な点がありましたら、お気軽にお問い合わせください。
                        </p>
                        <Button
                          asChild
                          variant="link"
                          className="p-0 h-auto mt-1 text-blue-500 hover:text-blue-600 font-medium"
                        >
                          <a
                            href="mailto:atk721@icloud.com"
                            className="flex items-center"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            atk721@icloud.com
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex justify-center pb-8">
            <Button
              asChild
              variant="default"
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Link href={`/dashboard/${salonCore?.salonId}`}>
                ダッシュボードに戻る
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}