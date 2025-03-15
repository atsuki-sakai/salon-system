"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useZodForm } from "@/hooks/useZodForm";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";

// 環境変数からConvex URLを取得
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
// Convex HTTP クライアントの初期化
const convex = new ConvexHttpClient(convexUrl!);

// メールアドレス入力バリデーション
const emailFormSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

// PINコード入力バリデーション
const pinFormSchema = z.object({
  pin: z
    .string()
    .min(1, "PINコードを入力してください")
    .length(4, "PINコードは4桁で入力してください")
    .regex(/^\d{4}$/, "PINコードは4桁の数字で入力してください"),
});

export default function StaffLoginForm() {
  const router = useRouter();
  const params = useParams();
  const { signOut } = useClerk();
  const staffSalonId = params.staff_salon_id as string;
  const [step, setStep] = useState<"email" | "pin">("email");

  // ステップ切り替え関数
  const changeStep = (newStep: "email" | "pin") => {
    if (newStep === "pin") {
      resetPinForm({ pin: "" });
    }
    setStep(newStep);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [salonLoading, setSalonLoading] = useState(true);
  const [salonError, setSalonError] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<{
    staffId: string;
    name?: string;
    email: string;
  } | null>(null);

  // サロン情報を取得
  useEffect(() => {
    const fetchSalonInfo = async () => {
      if (!staffSalonId) return;

      setSalonLoading(true);
      try {
        // サロン情報を取得
        const salonConfig = await convex
          .query(api.salon_config.getSalonConfigBySalonId, {
            salonId: staffSalonId,
          })
          .catch((error) => {
            console.error("Salon fetch error:", error);
            return null;
          });

        if (salonConfig) {
          setSalonName(salonConfig.salonName || "不明なサロン");
          setSalonError(null);
        } else {
          setSalonError(
            "サロンが見つかりません。URLが正しいか確認してください。"
          );
        }
      } catch (error) {
        console.error("Error fetching salon:", error);
        setSalonError(
          "サロン情報の取得に失敗しました。URLが正しいか確認してください。"
        );
      } finally {
        setSalonLoading(false);
      }
    };

    fetchSalonInfo();
  }, [staffSalonId]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useZodForm(emailFormSchema, {
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  // ステップ2: PINコードフォーム
  const {
    register: registerPin,
    handleSubmit: handlePinSubmit,
    formState: { errors: pinErrors },
    reset: resetPinForm,
  } = useZodForm(pinFormSchema, {
    mode: "onChange",
    defaultValues: {
      pin: "",
    },
  });

  // メールアドレス検証処理
  const onEmailSubmit = async (data: z.infer<typeof emailFormSchema>) => {
    if (!staffSalonId) {
      toast.error("サロンIDが見つかりません");
      return;
    }

    if (salonError) {
      toast.error(salonError);
      return;
    }

    setIsLoading(true);
    try {
      // 最初のステップのAPI呼び出し（メールアドレス検証のみ）
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          pin: "0000", // ダミーPIN（このステップではメールアドレスのみ検証）
          salonId: staffSalonId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "メールアドレスの検証に失敗しました"
        );
      }

      // スタッフ情報を保存してPINコード入力ステップへ
      setStaffData({
        staffId: responseData.staffData.staffId,
        name: responseData.staffData.name,
        email: data.email,
      });

      // PINステップに移動（フォームは自動的にリセットされる）
      changeStep("pin");
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error ? error.message : "ログイン処理に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // PINコード検証処理
  const onPinSubmit = async (data: z.infer<typeof pinFormSchema>) => {
    if (!staffData) {
      setStep("email");
      return;
    }

    if (!staffSalonId) {
      toast.error("サロンIDが見つかりません");
      return;
    }

    if (salonError) {
      toast.error(salonError);
      return;
    }

    setIsLoading(true);
    try {
      // 完全なログイン情報でAPI呼び出し
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: staffData.email,
          pin: data.pin,
          salonId: staffSalonId,
          staffId: staffData.staffId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "PINコードの検証に失敗しました");
      }

      // ログイン成功
      toast.success("ログインに成功しました");

      // もしClerkでログイン中の場合は、そのセッションをクリア
      try {
        const clerkSessionExists =
          typeof window !== "undefined" &&
          localStorage.getItem("clerk-db") !== null;
        if (clerkSessionExists) {
          // サイレントにClerkセッションをクリア（リダイレクトせずに）
          await signOut();
          console.log("Clerk session was cleared for staff login");
        }
      } catch (e) {
        console.error("Error clearing Clerk session:", e);
        // エラーがあっても処理は続行
      }

      // ダッシュボードへリダイレクト
      router.push(`/dashboard/${staffSalonId}`);
    } catch (error: unknown) {
      console.error("PIN verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "ログイン処理に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ステップが変わったときにPINフォームをリセット
  useEffect(() => {
    if (step === "pin") {
      resetPinForm({ pin: "" });
    }
  }, [step, resetPinForm]);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <span>スタッフログイン</span>
        </CardTitle>
        {salonLoading ? (
          <CardDescription>サロン情報を読み込み中...</CardDescription>
        ) : salonError ? (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{salonError}</AlertDescription>
          </Alert>
        ) : (
          <CardDescription className="flex flex-col items-center gap-1">
            <span className="font-medium text-blue-600">{salonName}</span>
            {step === "email"
              ? "メールアドレスを入力してください"
              : `${staffData?.name || "スタッフ"}様、PINコードを入力してください`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {salonError ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-500 mb-2">
              サロンが見つかりませんでした
            </p>
            <p className="text-xs text-gray-500">
              URLが正しいか確認してください
            </p>
          </div>
        ) : step === "email" ? (
          <form
            onSubmit={handleEmailSubmit(onEmailSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm text-gray-700">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@example.com"
                disabled={isLoading || salonLoading}
                {...registerEmail("email", {
                  required: "メールアドレスを入力してください",
                })}
              />
              {emailErrors?.email && (
                <p className="text-red-500 text-sm">
                  {emailErrors.email.message}
                </p>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                登録済みのメールアドレスを入力してください
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || salonLoading}
            >
              {isLoading ? "確認中..." : "次へ"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit(onPinSubmit)} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="pin" className="text-sm text-gray-700">
                PINコード (4桁)
              </label>
              <Input
                id="pin"
                type="text"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                disabled={isLoading}
                {...registerPin("pin", {
                  required: "PINコードを入力してください",
                  setValueAs: (value) => {
                    // 数字以外の文字を取り除く
                    return value ? value.replace(/[^0-9]/g, "") : "";
                  },
                })}
              />
              {pinErrors?.pin && (
                <p className="text-red-500 text-sm">{pinErrors.pin.message}</p>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                4桁のPINコードを入力してください
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isLoading}
                onClick={() => changeStep("email")}
              >
                戻る
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          スタッフ専用ログイン画面です
        </p>
        {!salonError && (
          <p className="text-xs text-blue-500">サロンID: {staffSalonId}</p>
        )}
      </CardFooter>
    </Card>
  );
}
