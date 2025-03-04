// app/subscription/page.tsx
"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserDetails } from "@/hooks/useUserDetail";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";

const features = [
  "予約カレンダーを作成、編集できます。",
  "カットメニューを作成、編集できます。",
  "スタッフ毎の予約カレンダーを作成、編集できます。",
  "スタッフ毎のカットメニューを作成、編集できます。",
];

export default function SubscriptionPage() {
  const { userDetails, isLoading } = useUserDetails();
  const [error, setError] = useState("");

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
      toast.success("サブスクリプションの更新が完了しました");
    } catch (err: unknown) {
      console.error("Subscription error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("サブスクリプションの開始に失敗しました。");
      }
      toast.error("サブスクリプションの更新に失敗しました");
    }
  };
  const handleBillingPortal = async () => {
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
  };

  console.log("userDetails", userDetails);
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20vh)] p-4">
      <Card className="max-w-md w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">サブスクリプション</CardTitle>
        </CardHeader>
        {userDetails?.subscriptionStatus === "active" ? (
          <CardContent>
            <div className="flex items-center justify-center  border-b border-green-200 pb-4 mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mr-2" />
              <p className="text-center text-lg font-bold text-green-700">
                サブスクリプション加入済み
              </p>
            </div>
            <span className="block text-sm text-gray-500 mb-4">
              以下のリンクから請求書や納品書をダンロードできます。
              <br />
              サブスクリプションを確認するには、以下のボタンをクリックしてください。
            </span>
            <Button
              onClick={handleBillingPortal}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold"
            >
              <span className="text-base font-bold">
                サブスクリプションを確認する
              </span>
            </Button>
          </CardContent>
        ) : (
          <CardContent>
            <p className="mb-4 py-4">
              <span className="text-3xl font-bold">30,000</span>円/月
              <br />
              <span className="text-sm text-gray-500">
                サブスクリプションに加入すると、全機能をご利用いただけます。
              </span>
            </p>
            <ul className="list-inside text-sm text-gray-500 my-5">
              {features.map((feature, index) => (
                <li
                  key={`features-${index}`}
                  className="flex items-center gap-2 py-0.5"
                >
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            {error && <p className="text-red-600 mb-4">{error}</p>}
            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold"
            >
              今すぐ加入する
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
