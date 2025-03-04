// hooks/useSubscription.ts
import { useUserDetails } from "@/hooks/useUserDetail";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSubscription() {
  const { userDetails, isLoading } = useUserDetails();
  const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    const createSession = useAction(api.subscriptions.createSubscriptionSession);
    const createBillingPortal = useAction(api.subscriptions.createBillingPortalSession);
  
    const initiateSubscription = async () => {
      if (isLoading) {
        setError("ユーザー情報の読み込み中です");
        return null;
      }
  
      if (!userDetails?.stripeCustomerId) {
        setError("Stripeの顧客情報が見つかりません");
        return null;
      }
  
      setIsProcessing(true);
      try {
        const result = await createSession({
          stripeCustomerId: userDetails.stripeCustomerId,
          clerkUserId: userDetails?.clerkId ?? "",
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
          baseUrl: process.env.NEXT_PUBLIC_URL!,
        });
  
        return result?.checkoutUrl;
      } catch (err: unknown) {
        console.error("Subscription error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("サブスクリプションの開始に失敗しました。");
        }
        return null;
      } finally {
        setIsProcessing(false);
      }
    };
  
    const openBillingPortal = async () => {
      if (!userDetails?.stripeCustomerId) {
        setError("Stripeの顧客情報が見つかりません");
        return null;
      }
  
      setIsProcessing(true);
      try {
        const result = await createBillingPortal({
          customerId: userDetails.stripeCustomerId,
          returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/${userDetails?.clerkId}`,
        });
        
        return result?.portalUrl;
      } catch (err) {
        console.error("Billing portal error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("請求ポータルの作成に失敗しました。");
        }
        return null;
      } finally {
        setIsProcessing(false);
      }
    };
  
    return {
      isLoading,
      error,
      isProcessing,
      initiateSubscription,
      openBillingPortal,
      isSubscribed: userDetails?.subscriptionStatus === "active",
    };
  }
  
