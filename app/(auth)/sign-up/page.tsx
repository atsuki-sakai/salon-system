// app/sign-up/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { z } from "zod";
import { signInSignUpSchema } from "@/lib/validations";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      signInSignUpSchema.parse({ email, password });
      await signUp.create({ emailAddress: email, password });

      // メール確認コードを送信
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err instanceof z.ZodError) {
        setError(err.message);
      } else {
        setError("サインアップに失敗しました");
      }
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // ユーザーIDを使用してダッシュボードにリダイレクト
        router.push(`/dashboard`);
      } else {
        setError("認証に失敗しました。もう一度お試しください。");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("認証コードの検証に失敗しました");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">会員登録</h2>
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {!pendingVerification ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登録する
            </Button>
          </form>
        ) : (
          <form onSubmit={onPressVerify} className="space-y-4">
            <p className="mb-4">
              登録したメールアドレスに認証コードを送信しました。
              メールの受信ボックスを確認して、認証コード(6桁の数字)を入力してください。
            </p>
            <div>
              <Label htmlFor="code">認証コード</Label>
              <Input
                id="code"
                value={code}
                placeholder="認証コードを入力"
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              認証する
            </Button>
          </form>
        )}

        <div className="text-end mt-4">
          <Link href="/sign-in">
            <span className="text-sm text-indigo-500 underline">
              ログインはこちら
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
