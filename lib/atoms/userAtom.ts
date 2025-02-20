import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
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

// Atomの定義：localStorageに保存してキャッシュを有効化
export const userDetailsAtom = atomWithStorage<UserDetails>('userDetails', null);

// カスタムフック
export function useUserDetails() {
  const { user } = useUser();
  const [cachedUserDetails, setCachedUserDetails] = useAtom(userDetailsAtom);
  
  const clerkId = user?.id ?? "";
  const convexUser = useQuery(api.users.getUserByClerkId, { clerkId });

  // Convexから取得したデータがキャッシュと異なる場合のみキャッシュを更新する
  useEffect(() => {
    if (convexUser) {
      const cachedStr = JSON.stringify(cachedUserDetails);
      const convexStr = JSON.stringify(convexUser);
      if (cachedStr !== convexStr) {
        setCachedUserDetails(convexUser);
      }
    }
  }, [convexUser, cachedUserDetails, setCachedUserDetails]);

  // キャッシュがあれば優先的に利用
  const userDetails = cachedUserDetails || convexUser;

  // ユーザーが存在している場合、キャッシュがあればローディング状態にならないようにする
  const isLoading = !user ? true : (cachedUserDetails ? false : !convexUser);

  return {
    user,         // Clerkのユーザー情報
    userDetails,  // キャッシュまたはConvexから取得したユーザー情報
    isLoading,    // キャッシュがあればfalse、なければConvexの取得状況で判定
  };
}
