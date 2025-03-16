"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ErrorType, handleError } from "@/lib/errors";
import { useZodForm } from "@/hooks/useZodForm";
import { signUpSchema } from "@/lib/validations";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  User,
  Loader2,
} from "lucide-react";
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
    className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-300 
      ${fulfilled ? "bg-green-600 text-white" : "bg-gray-200"}`}
  >
    {fulfilled && <CheckCircle className="w-3 h-3" />}
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
    <div className="space-y-2">
      <div className="flex w-full justify-between items-center">
        <Label htmlFor="password" className="text-sm font-medium">
          パスワード
        </Label>
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          {...register("password")}
          placeholder="パスワードを入力"
          required
          className="pl-10 pr-10"
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : undefined}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
          aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {errors.password && (
        <p id="password-error" className="text-xs text-red-600" role="alert">
          {errors.password.message}
        </p>
      )}
    </div>
  );
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

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength>("empty");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const clerkClient = useClerk();

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
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-2"
      >
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
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
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
            transition={{ duration: 0.4 }}
            className={`h-full ${getStrengthColor(passwordStrength)}`}
          ></motion.div>
        </div>
      </motion.div>
    );
  }, [password, passwordStrength]);

  // メモ化されたパスワード要件チェックリスト
  const PasswordRequirementsList = useMemo(() => {
    if (!password) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-3 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.length} />
            <span
              className={`text-xs ${passwordCriteria.length ? "text-green-700 font-medium" : "text-gray-500"}`}
            >
              8文字以上
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.uppercase} />
            <span
              className={`text-xs ${passwordCriteria.uppercase ? "text-green-700 font-medium" : "text-gray-500"}`}
            >
              大文字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.lowercase} />
            <span
              className={`text-xs ${passwordCriteria.lowercase ? "text-green-700 font-medium" : "text-gray-500"}`}
            >
              小文字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.number} />
            <span
              className={`text-xs ${passwordCriteria.number ? "text-green-700 font-medium" : "text-gray-500"}`}
            >
              数字を含む
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckIcon fulfilled={passwordCriteria.special} />
            <span
              className={`text-xs ${passwordCriteria.special ? "text-green-700 font-medium" : "text-gray-500"}`}
            >
              特殊文字を含む (例: !@#$%^&*)
            </span>
          </div>
        </div>
      </motion.div>
    );
  }, [password, passwordCriteria]);

  // 登録フォーム送信ハンドラ
  const onSignUpSubmit = async (data: { email: string; password: string }) => {
    if (!isLoaded) return;

    try {
      console.log(data);
      console.log(clerkClient);
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
                オーナーアカウント作成
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                アカウントを作成して始めましょう
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {!pendingVerification ? (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit(onSignUpSubmit)}
                  className="space-y-4"
                  noValidate
                >
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
                        aria-invalid={errors.email ? "true" : "false"}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {errors.email && (
                      <p
                        id="email-error"
                        className="text-xs text-red-600"
                        role="alert"
                      >
                        {errors.email.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <PasswordInput
                      register={register}
                      showPassword={showPassword}
                      toggleShowPassword={toggleShowPassword}
                      errors={errors}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      確認用パスワード
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register("confirmPassword")}
                        placeholder="同じパスワードを再入力"
                        className="pl-10"
                        required
                        aria-invalid={errors.confirmPassword ? "true" : "false"}
                        aria-describedby={
                          errors.confirmPassword ? "password-error" : undefined
                        }
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="text-xs text-red-600"
                        role="alert"
                      >
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </motion.div>

                  {/* メモ化されたコンポーネントを使用 */}
                  {PasswordStrengthIndicator}
                  {PasswordRequirementsList}

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full "
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? "処理中..." : "登録する"}
                      {isSubmitting ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <User className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.form
                  key="verification-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={onVerifySubmit}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
                  >
                    <p className="text-center text-xs text-blue-500">
                      登録したメールアドレスに認証コードを送信しました。
                      メールの受信ボックスを確認して、認証コード(6桁の数字)を入力してください。
                    </p>
                  </motion.div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="verification-code"
                      className="text-xs font-medium"
                    >
                      認証コード
                    </Label>
                    <Input
                      id="verification-code"
                      value={verificationCode}
                      placeholder="000000"
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      className="text-center font-mono text-lg tracking-wider"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!verificationCode || verificationCode.length < 6}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    認証する
                  </Button>

                  <div className="text-center text-sm text-gray-500">
                    認証コードが届きませんか？
                    <button
                      type="button"
                      className="ml-1 text-indigo-600 hover:text-indigo-800 underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
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
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator className="bg-gray-200 dark:bg-gray-700 w-1/2 mx-auto my-2" />
            <motion.div variants={itemVariants} className="w-full text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                すでにアカウントをお持ちですか？{" "}
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  ログインする
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </p>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
