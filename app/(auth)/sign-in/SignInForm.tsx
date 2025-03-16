"use client";

import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { useZodForm } from "@/hooks/useZodForm";
import * as Sentry from "@sentry/nextjs";
import { AppError, ErrorType, handleError } from "@/lib/errors";
import { signInSchema } from "@/lib/validations";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm(signInSchema);

  const email = watch("email");

  // スタッフセッションのクリア関数
  const clearStaffSession = () => {
    try {
      // スタッフトークンをCookieから削除
      Cookies.remove("staff_token", { path: "/" });

      // ローカルストレージからも削除
      if (typeof window !== "undefined") {
        localStorage.removeItem("staff_auth_token");
        console.log("Staff session was cleared for owner login");
      }
    } catch (e) {
      console.error("Error clearing staff session:", e);
    }
  };

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded) return;

    try {
      // サインイン前にスタッフセッションをクリア
      clearStaffSession();

      // まず既存のサインインセッションを作成
      const signInAttempt = await signIn.create({
        identifier: data.email,
      });

      // 次にパスワードで認証
      const result = await signInAttempt.attemptFirstFactor({
        strategy: "password",
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(`/dashboard`);
        toast.success("ログインに成功しました");
      } else {
        throw new AppError(
          `予期しない認証状態: ${result.status}`,
          ErrorType.AUTHENTICATION
        );
      }
    } catch (err: unknown) {
      console.log(err);
      const appError = handleError(err);
      if (
        appError.type === ErrorType.SERVER ||
        appError.type === ErrorType.UNKNOWN
      ) {
        Sentry.captureException(err);
      }
      console.log(appError.message);
      toast.error("ログインに失敗しました");
    } finally {
      setIsSubmitted(true);
    }
  };

  // パスワード表示/非表示の切り替え
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // アニメーションのバリアント
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md p-2"
      >
        <Card className="border-0 shadow-lg shadow-blue-100/20 dark:shadow-gray-900/40 backdrop-blur-sm bg-white/90 dark:bg-gray-900/80">
          <CardHeader className="space-y-1">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-center">
                オーナー専用ログインページ
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                アカウントにサインインして続行
              </p>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  メールアドレス
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="メールアドレスを入力"
                    className="pl-10"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  パスワード
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="パスワードを入力"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                    aria-label={
                      showPassword ? "パスワードを隠す" : "パスワードを表示"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full "
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "ログイン中..." : "ログイン"}
                  {isSubmitting ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </motion.div>

              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center pt-4"
                >
                  <Link
                    href={`/sign-in/reset-password?email=${email}`}
                    className="text-sm text-blue-500"
                  >
                    パスワードをお忘れですか？
                  </Link>
                </motion.div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator className="bg-gray-200 dark:bg-gray-700 w-1/2 mx-auto my-2" />
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between w-full text-right text-xs"
            >
              <Link
                href="/staff/login"
                className="inline-flex items-center text-xs text-blue-500"
              >
                スタッフの方はこちら
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center text-xs text-blue-500"
              >
                新規登録はこちら
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
