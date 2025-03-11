"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useParams } from "next/navigation";
import { EyeOffIcon, EyeIcon } from "lucide-react";

// パスワード変更用のバリデーションスキーマ
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "現在のパスワードを入力してください"),
    newPassword: z.string().min(6, "新しいパスワードは6文字以上必要です"),
    confirmNewPassword: z
      .string()
      .min(6, "確認用パスワードは6文字以上必要です"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "新しいパスワードと確認用パスワードが一致しません",
    path: ["confirmNewPassword"],
  });

export default function ChangePasswordPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(changePasswordSchema);

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    if (!isLoaded) return;
    try {
      // Clerk の update 関数を利用してパスワード変更を実行
      await user?.updatePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
      });
      toast.success("パスワードが更新されました");
      router.push(`/dashboard/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("パスワードの更新に失敗しました");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-center text-xl mb-4 font-bold">パスワード変更</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">現在のパスワード</Label>
          <div className="relative flex items-center">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              {...register("currentPassword")}
            />{" "}
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className={`ml-2 ${
                showCurrentPassword ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {showCurrentPassword ? <EyeIcon /> : <EyeOffIcon />}
            </Button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-sm">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <div className="relative flex items-center">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword")}
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className={`ml-2 ${
                showNewPassword ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {showNewPassword ? <EyeIcon /> : <EyeOffIcon />}
            </Button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-sm">{errors.newPassword.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmNewPassword">新しいパスワード（確認）</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            {...register("confirmNewPassword")}
          />
          {errors.confirmNewPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmNewPassword.message}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            パスワードを変更
          </Button>
        </div>
      </form>
    </div>
  );
}
