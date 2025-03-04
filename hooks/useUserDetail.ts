import { useUser } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { userDetailsAtom } from "@/lib/atoms/userAtom";
import { useEffect, useMemo, useCallback } from "react";
import { UserDetails } from "@/lib/atoms/userAtom";

export function useUserDetails() {
    const { user } = useUser();
    const [cachedUserDetails, setCachedUserDetails] = useAtom(userDetailsAtom);
    
    const clerkId = user?.id ?? "";
    const convexUser = useQuery(api.users.getUserByClerkId, { clerkId });


  // ユーザーデータの比較関数（メモ化して再計算を防止）
  const areUserDetailsDifferent = useCallback((cached: UserDetails, convex: UserDetails) => {
    if (!cached && !convex) return false;
    if (!cached || !convex) return true;
    
    return (
      cached.clerkId !== convex.clerkId ||
      cached.email !== convex.email ||
      cached.stripeCustomerId !== convex.stripeCustomerId ||
      cached.subscriptionId !== convex.subscriptionId ||
      cached.subscriptionStatus !== convex.subscriptionStatus
    );
  }, []);

  
    // Convexから取得したデータがキャッシュと異なる場合のみキャッシュを更新する
    useEffect(() => {
      if (convexUser && !areUserDetailsDifferent(cachedUserDetails, convexUser)) {
        setCachedUserDetails(convexUser);
      }
    }, [convexUser, cachedUserDetails, setCachedUserDetails, areUserDetailsDifferent]);

      // ユーザーの状態を計算（メモ化）
    const userState = useMemo(() => {
      // キャッシュがあれば優先的に利用
      const userDetails = cachedUserDetails || convexUser;
      
      // ユーザーが存在している場合、キャッシュがあればローディング状態にならないようにする
      const isLoading = !user ? true : (cachedUserDetails ? false : !convexUser);
      
      return { userDetails, isLoading };
    }, [user, cachedUserDetails, convexUser]);

    return {
      user,   // Clerkのユーザー情報
      userDetails: userState.userDetails,  // キャッシュまたはConvexから取得したユーザー情報
      isLoading: userState.isLoading,    // キャッシュがあればfalse、なければConvexの取得状況で判定
    };
  }
  