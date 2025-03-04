"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ErrorType, handleError } from "@/lib/errors";
import { useZodForm } from "@/hooks/useZodForm";
import { signUpSchema } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { z } from "zod";

// パスワード強度の型定義
type PasswordStrength = "empty" | "weak" | "medium" | "strong" | "veryStrong";

// パスワード強度に基づく色を取得
const getStrengthColor = (strength: PasswordStrength) => {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
    case "veryStrong":
      return "bg-emerald-600";
    default:
      return "bg-gray-200";
  }
};

// パスワード強度に基づくテキストを取得
const getStrengthText = (strength: PasswordStrength) => {
  switch (strength) {
    case "weak":
      return "弱い";
    case "medium":
      return "普通";
    case "strong":
      return "強い";
    case "veryStrong":
      return "非常に強い";
    default:
      return "";
  }
};

// パスワード要件チェックアイコン - メモ化
const CheckIcon = ({ fulfilled }: { fulfilled: boolean }) => (
  <div
    className={`flex items-center justify-center w-4 h-4 rounded-full 
      ${fulfilled ? "bg-green-700 text-white" : "bg-gray-200"}`}
  >
    {fulfilled && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-3 h-3"
      >
        <path
          fillRule="evenodd"
          d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
          clipRule="evenodd"
        />
      </svg>
    )}
  </div>
);

type SignUpFormData = z.infer<typeof signUpSchema>;

type PasswordInputProps = {
  register: UseFormRegister<SignUpFormData>;
  errors: FieldErrors<SignUpFormData>;
  showPassword: boolean;
  toggleShowPassword: () => void;
};

const PasswordInput = ({
  register,
  showPassword,
  toggleShowPassword,
  errors,
}: PasswordInputProps) => {
  return (
    <div>
      <div className="flex w-full justify-between">
        <Label htmlFor="password">パスワード</Label>
        <Button
          type="button"
          onClick={toggleShowPassword}
          variant={showPassword ? "default" : "outline"}
          className="ml-2 text-xs h-5 w-5 mb-2"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        {...register("password")}
        placeholder="パスワードを入力"
        required
        aria-invalid={errors.password ? "true" : "false"}
        aria-describedby={errors.password ? "password-error" : undefined}
        autoComplete="new-password"
      />
      {errors.password && (
        <p
          id="password-error"
          className="mt-1 text-xs text-red-600"
          role="alert"
        >
          {errors.password.message}
        </p>
      )}
    </div>
  );
};

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength>("empty");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useZodForm(signUpSchema);

  // メモ化されたトグル関数
  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // パスワード条件の充足状況 - useMemoでメモ化
  const passwordCriteria = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  // パスワード値の監視
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "password") {
        setPassword(value.password || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // パスワード強度を計算 - パスワードが変わった時だけ実行
  useEffect(() => {
    if (!password) {
      setPasswordStrength("empty");
      return;
    }

    let strength = 0;

    // 長さチェック
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // 文字種チェック
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // 強度の判定
    if (strength <= 2) {
      setPasswordStrength("weak");
    } else if (strength <= 3) {
      setPasswordStrength("medium");
    } else if (strength <= 4) {
      setPasswordStrength("strong");
    } else {
      setPasswordStrength("veryStrong");
    }
  }, [password]);

  // メモ化されたパスワード強度表示コンポーネント
  const PasswordStrengthIndicator = useMemo(() => {
    if (!password) return null;

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">パスワード強度:</span>
          <span
            className={`text-xs font-medium ${
              passwordStrength === "weak"
                ? "text-red-700"
                : passwordStrength === "medium"
                  ? "text-yellow-700"
                  : passwordStrength === "strong"
                    ? "text-green-700"
                    : passwordStrength === "veryStrong"
                      ? "text-emerald-700"
                      : ""
            }`}
          >
            {getStrengthText(passwordStrength)}
          </span>
        </div>
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300 ease-in-out`}
            style={{
              width:
                passwordStrength === "empty"
                  ? "0%"
                  : passwordStrength === "weak"
                    ? "25%"
                    : passwordStrength === "medium"
                      ? "50%"
                      : passwordStrength === "strong"
                        ? "75%"
                        : "100%",
            }}
          ></div>
        </div>
      </div>
    );
  }, [password, passwordStrength]);

  // メモ化されたパスワード要件チェックリスト
  const PasswordRequirementsList = useMemo(() => {
    if (!password) return null;

    return (
      <div className="mt-1 space-y-1 bg-gray-50 p-2 rounded-md border border-gray-50">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.length} />
            <span
              className={`text-xs ${passwordCriteria.length ? "text-green-700 font-medium" : "text-gray-400"}`}
            >
              8文字以上
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.uppercase} />
            <span
              className={`text-xs ${passwordCriteria.uppercase ? "text-green-700 font-medium" : "text-gray-400"}`}
            >
              大文字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.lowercase} />
            <span
              className={`text-xs ${passwordCriteria.lowercase ? "text-green-700 font-medium" : "text-gray-400"}`}
            >
              小文字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.number} />
            <span
              className={`text-xs ${passwordCriteria.number ? "text-green-700 font-medium" : "text-gray-400"}`}
            >
              数字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.special} />
            <span
              className={`text-xs ${passwordCriteria.special ? "text-green-700 font-medium" : "text-gray-400"}`}
            >
              特殊文字を含む (例: !@#$%^&*)
            </span>
          </div>
        </div>
      </div>
    );
  }, [password, passwordCriteria]);

  // 登録フォーム送信ハンドラ
  const onSignUpSubmit = async (data: { email: string; password: string }) => {
    if (!isLoaded) return;

    try {
      // Clerkでユーザー作成
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      // メール確認コードを送信
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      toast.success("アカウントが作成されました。メールを確認してください");
    } catch (err) {
      const appError = handleError(err);

      if (
        appError.type === ErrorType.SERVER ||
        appError.type === ErrorType.UNKNOWN
      ) {
        Sentry.captureException(err);
      }
      toast.error("アカウントの作成に失敗しました");
    }
  };

  // 認証コード確認ハンドラ
  const onVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("認証に成功しました");
        router.push(`/dashboard`);
      } else {
        toast.error("認証に失敗しました");
      }
    } catch (err) {
      const appError = handleError(err);
      if (
        appError.type === ErrorType.SERVER ||
        appError.type === ErrorType.UNKNOWN
      ) {
        Sentry.captureException(err);
      }
      toast.error("認証コードの検証に失敗しました");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">会員登録</h2>

        {!pendingVerification ? (
          <form
            onSubmit={handleSubmit(onSignUpSubmit)}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="メールアドレスを入力"
                required
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* パスワード入力フィールドを分離コンポーネントとして使用 */}
            <PasswordInput
              register={register}
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              errors={errors}
            />

            <div>
              <Label htmlFor="confirmPassword">確認用パスワード</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="同じパスワードを再入力"
                required
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  errors.confirmPassword ? "password-error" : undefined
                }
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* メモ化されたコンポーネントを使用 */}
            {PasswordStrengthIndicator}
            {PasswordRequirementsList}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "処理中..." : "登録する"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerifySubmit} className="space-y-4">
            <p className="mb-4 text-center text-sm text-gray-600">
              登録したメールアドレスに認証コードを送信しました。
              メールの受信ボックスを確認して、認証コード(6桁の数字)を入力してください。
            </p>
            <div>
              <Label htmlFor="verification-code">認証コード</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                placeholder="000000"
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!verificationCode || verificationCode.length < 6}
            >
              認証する
            </Button>
            <p className="text-center text-sm text-gray-500">
              認証コードが届きませんか？
              <button
                type="button"
                className="ml-1 text-indigo-600 hover:text-indigo-800 underline"
                onClick={async () => {
                  try {
                    await signUp?.prepareEmailAddressVerification({
                      strategy: "email_code",
                    });
                    toast.success("認証コードを再送信しました");
                  } catch (err) {
                    const appError = handleError(err);
                    if (
                      appError.type === ErrorType.SERVER ||
                      appError.type === ErrorType.UNKNOWN
                    ) {
                      Sentry.captureException(err);
                    }
                    toast.error("認証コードの再送信に失敗しました");
                  }
                }}
              >
                再送信する
              </button>
            </p>
          </form>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{" "}
            <Link
              href="/sign-in"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ログインする
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
