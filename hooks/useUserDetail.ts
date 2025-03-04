"use client";

// lib/atoms/userAtom.ts の改善版
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

// キャッシュキーをユーザーIDごとに分ける
export function getUserCacheKey(userId: string) {
  return `userDetails_${userId}`;
}

// ログアウト時に呼び出すキャッシュクリア関数
export function clearUserCache() {
  // localStorage からユーザー関連のデータをすべて削除
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('userDetails_')) {
      localStorage.removeItem(key);
    }
  }
}

// カスタムフック
export function useUserDetails() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  
  // ユーザーIDごとに異なるキャッシュキーを使用
  const cacheKey = clerkId ? getUserCacheKey(clerkId) : "userDetails_anonymous";
  const userDetailsAtom = atomWithStorage<UserDetails>(cacheKey, null);
  const [cachedUserDetails, setCachedUserDetails] = useAtom(userDetailsAtom);
  
  const convexUser = useQuery(api.users.getUserByClerkId, { clerkId });

  // Convexから取得したデータがキャッシュと異なる場合のみキャッシュを更新する
  useEffect(() => {
    if (convexUser) {
      // clerkIdが変わったらキャッシュを無視して新しいデータを使用
      if (cachedUserDetails?.clerkId !== clerkId) {
        setCachedUserDetails(convexUser);
        return;
      }
      
      const cachedStr = JSON.stringify(cachedUserDetails);
      const convexStr = JSON.stringify(convexUser);
      if (cachedStr !== convexStr) {
        setCachedUserDetails(convexUser);
      }
    }
  }, [convexUser, cachedUserDetails, setCachedUserDetails, clerkId]);

  // ユーザーIDが変わった場合はキャッシュよりも新しいデータを優先
  const isCurrentUserCache = cachedUserDetails?.clerkId === clerkId;
  const userDetails = (isCurrentUserCache && cachedUserDetails) || convexUser;
  
  // ユーザーが存在している場合、キャッシュがあればローディング状態にならないようにする
  const isLoading = !user ? true : (isCurrentUserCache && cachedUserDetails ? false : !convexUser);

  return {
    user,
    userDetails,
    isLoading,
  };
}