// app/subscription/page.tsx
"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserDetails } from "@/lib/atoms/userAtom";

export default function SubscriptionPage() {
  const { userDetails, isLoading } = useUserDetails();
  const [error, setError] = useState("");
  // Convex側の Stripe Checkout セッション作成 Mutation を利用
  const createSession = useAction(api.subscriptions.createSubscriptionSession);
  const createBillingPortal = useAction(
    api.subscriptions.createBillingPortalSession
  );

  const handleSubscribe = async () => {
    if (isLoading) {
      setError("ユーザー情報の読み込み中です");
      return;
    }

    if (!userDetails?.stripeCustomerId) {
      setError("Stripeの顧客情報が見つかりません");
      return;
    }

    try {
      console.log("Creating subscription for user:", userDetails?.clerkId);
      const result = await createSession({
        stripeCustomerId: userDetails.stripeCustomerId,
        clerkUserId: userDetails?.clerkId ?? "",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
        baseUrl: process.env.NEXT_PUBLIC_URL!,
      });

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (err: unknown) {
      console.error("Subscription error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("サブスクリプションの開始に失敗しました。");
      }
    }
  };

  console.log("userDetails", userDetails);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">プレミアムプラン</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            月額¥1,000
            のプレミアムプランに加入すると、全機能をご利用いただけます。
          </p>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <Button onClick={handleSubscribe} className="w-full">
            今すぐ加入する
          </Button>
        </CardContent>
      </Card>
      <Button
        onClick={async () => {
          // まず、Stripe 顧客IDが正しく取得できているかログで確認
          console.log("Stripe Customer ID:", userDetails?.stripeCustomerId);

          // Billing Portal セッションを作成する
          const result = await createBillingPortal({
            customerId: userDetails?.stripeCustomerId ?? "",
            returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/${userDetails?.clerkId}`,
          });

          // 返却された portalUrl を使ってリダイレクト
          if (result?.portalUrl) {
            window.location.href = result.portalUrl;
          } else {
            console.error("Billing Portal の URL が取得できませんでした。");
          }
        }}
        className="w-full"
      >
        {userDetails?.stripeCustomerId ? "請求書を確認する" : "読み込み中..."}
      </Button>
    </div>
  );
}
