"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import { resetPasswordSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";

// フォーム共通のエラーメッセージ表示を含むリセットコード送信用コンポーネント
function ResetCodeForm({
  register,
  errors,
  handleSubmit,
  onSubmit,
  isSubmitting,
}: {
  register: UseFormRegister<z.infer<typeof resetPasswordSchema>>;
  errors: FieldErrors<z.infer<typeof resetPasswordSchema>>;
  handleSubmit: UseFormHandleSubmit<z.infer<typeof resetPasswordSchema>>;
  onSubmit: (data: z.infer<typeof resetPasswordSchema>) => void;
  isSubmitting: boolean;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="email">アカウントのメールアドレス</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="メールアドレスを入力"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          確認コードを送信
        </Button>
      </div>
    </form>
  );
}

// フォーム共通のエラーメッセージ表示を含むパスワードリセット用コンポーネント
function ResetPasswordForm({
  register,
  errors,
  handleSubmit,
  onSubmit,
  isSubmitting,
}: {
  register: UseFormRegister<z.infer<typeof resetPasswordSchema>>;
  errors: FieldErrors<z.infer<typeof resetPasswordSchema>>;
  handleSubmit: UseFormHandleSubmit<z.infer<typeof resetPasswordSchema>>;
  onSubmit: (data: z.infer<typeof resetPasswordSchema>) => void;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <p className="text-sm mb-4 bg-gray-100 p-2 text-slate-700 rounded-md">
        メールアドレスに届いた確認コードを入力してください。
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="code">確認コード</Label>
          <Input id="code" {...register("code")} />
          {errors.code && (
            <p className="text-red-500 text-sm">{errors.code.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm">{errors.newPassword.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">確認用パスワード</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            パスワードをリセット
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(resetPasswordSchema);

  // リセットコード送信処理
  const handleSendResetCode = async (
    data: z.infer<typeof resetPasswordSchema>
  ) => {
    if (!signInLoaded) return;
    try {
      const createdSignIn = await signIn.create({
        identifier: data.email,
      });

      const emailAddressId = createdSignIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code"
      )?.emailAddressId;

      if (!emailAddressId) {
        throw new Error("メールアドレスが見つかりませんでした。");
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId,
      });
      setEmailSent(true);
      toast.success("確認コードを送信しました。メールをご確認ください。");
    } catch (err) {
      console.error(err);
      toast.error("確認コードの送信に失敗しました。");
    }
  };

  // パスワードリセット処理
  const handleResetPassword = async (
    data: z.infer<typeof resetPasswordSchema>
  ) => {
    console.log(data);
    console.log(signInLoaded);
    if (!signInLoaded) return;
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code ?? "",
        password: data.newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("パスワードが正常にリセットされました");
        router.push("/sign-in");
      }
    } catch (err) {
      console.error(err);
      toast.error("パスワードのリセットに失敗しました");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl mb-4 font-bold">パスワードリセット</h2>
      <div className="max-w-xl min-w-[280px] mx-auto">
        {!emailSent ? (
          <ResetCodeForm
            register={register}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={handleSendResetCode}
            isSubmitting={isSubmitting}
          />
        ) : (
          <ResetPasswordForm
            register={register}
            errors={errors}
            handleSubmit={handleSubmit}
            onSubmit={handleResetPassword}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
