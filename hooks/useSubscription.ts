// hooks/useSubscription.ts
import { useSalonCore } from "@/hooks/useSalonCore";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSubscription() {
  const { salonCore, isLoading } = useSalonCore();
  const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    const createSession = useAction(api.subscription.createSubscriptionSession);
    const createBillingPortal = useAction(api.subscription.createBillingPortalSession);
  
    const initiateSubscription = async () => {
      if (isLoading) {
        setError("ユーザー情報の読み込み中です");
        return null;
      }
  
      if (!salonCore?.stripeCustomerId) {
        setError("Stripeの顧客情報が見つかりません");
        return null;
      }
  
      setIsProcessing(true);
      try {
        const result = await createSession({
          stripeCustomerId: salonCore.stripeCustomerId,
          clerkUserId: salonCore?.clerkId ?? "",
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
      if (!salonCore?.stripeCustomerId) {
        setError("Stripeの顧客情報が見つかりません");
        return null;
      }
  
      setIsProcessing(true);
      try {
        const result = await createBillingPortal({
          customerId: salonCore.stripeCustomerId,
          returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/${salonCore?.clerkId}`,
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
      isSubscribed: salonCore?.subscriptionStatus === "active",
    };
  }
  
