import { atom, useAtom } from 'jotai';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';

// 型定義
export type UserDetails = {
  clerkId: string;
  email: string;
  stripeCustomerId: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
} | null;

// Atomの定義
export const userDetailsAtom = atom<UserDetails>(null);

// カスタムフック
export function useUserDetails() {
  const { user } = useUser();
  const [userDetails, setUserDetails] = useAtom(userDetailsAtom);
  
  // Convexからユーザー情報を取得
  const convexUser = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id ?? "",
  });

  // ユーザー情報が更新されたらatomを更新
  useEffect(() => {
    if (convexUser) {
      setUserDetails(convexUser);
    }
  }, [convexUser, setUserDetails]);

  return {
    user,        // Clerkのユーザー情報
    userDetails, // Convexのユーザー情報
    isLoading: !user || !userDetails,
  };
} 