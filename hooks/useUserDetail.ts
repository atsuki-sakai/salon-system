"use client";

import { useAtomValue, useSetAtom } from 'jotai';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';
import { getUserDetailsAtom, clearUserDetailsAtoms } from '@/lib/atoms/userDetailsAtoms';

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

// 既存のclearUserCache関数を新しい実装で置き換え
export const clearUserCache = clearUserDetailsAtoms;

// カスタムフック
export function useUserDetails() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  
  // データ更新のフラグ
  const hasUpdatedRef = useRef(false);
  
  // 一元管理されたアトムを取得
  const userDetailsAtom = getUserDetailsAtom(clerkId);
  const cachedUserDetails = useAtomValue(userDetailsAtom);
  const setCachedUserDetails = useSetAtom(userDetailsAtom);
  
  const convexUser = useQuery(api.users.getUserByClerkId, 
    clerkId ? { clerkId } : "skip"
  );

  // データ更新のロジック
  useEffect(() => {
    if (hasUpdatedRef.current) return;
    if (!convexUser) return;
    
    if (cachedUserDetails?.clerkId !== clerkId) {
      setCachedUserDetails(convexUser);
      hasUpdatedRef.current = true;
      return;
    }
    
    const cachedStr = JSON.stringify(cachedUserDetails);
    const convexStr = JSON.stringify(convexUser);
    if (cachedStr !== convexStr) {
      setCachedUserDetails(convexUser);
      hasUpdatedRef.current = true;
    }
  }, [convexUser, clerkId]);

  // ユーザーIDが変わるたびにフラグをリセット
  useEffect(() => {
    hasUpdatedRef.current = false;
  }, [clerkId]);
  
  const isCurrentUserCache = cachedUserDetails?.clerkId === clerkId;
  const userDetails = (isCurrentUserCache && cachedUserDetails) || convexUser;
  const isLoading = !user ? true : (isCurrentUserCache && cachedUserDetails ? false : !convexUser);

  return { user, userDetails, isLoading };
}