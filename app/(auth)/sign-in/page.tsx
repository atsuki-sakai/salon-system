// app/sign-in/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { useZodForm } from "@/hooks/useZodForm";
import * as Sentry from "@sentry/nextjs";
import { AppError, ErrorType, handleError } from "@/lib/errors";
import { signInSchema } from "@/lib/validations";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { toast } from "sonner";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(signInSchema);

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded) return;

    try {
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">ログイン</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="メールアドレスを入力"
              required
            />
            {errors.email && (
              <p className="mb-4 text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="パスワードを入力"
              required
            />
            {errors.password && (
              <p className="mb-4 text-red-600">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            ログイン
          </Button>
          {isSubmitted && (
            <Link href="/sign-in/reset-password">
              <p className="text-sm text-center text-blue-600 underline mt-5">
                パスワードをお忘れですか？
              </p>
            </Link>
          )}
        </form>

        <div className="text-end mt-4">
          <Link href="/sign-up">
            <span className="text-sm text-indigo-500 underline">
              新規登録はこちら
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
