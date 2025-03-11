"use client";

import { useAtomValue, useSetAtom } from 'jotai';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';
import { getSalonCoreAtom, clearSalonCoreAtoms } from '@/lib/atoms/salonCoreAtoms';


// キャッシュキーをユーザーIDごとに分ける
export function getUserCacheKey(userId: string) {
  return `userDetails_${userId}`;
}

// 既存のclearUserCache関数を新しい実装で置き換え
export const clearUserCache = clearSalonCoreAtoms;

// カスタムフック
export function useSalonCore() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  // データ更新のフラグ
  const hasUpdatedRef = useRef(false);
  
  // 一元管理されたアトムを取得
  const salonCoreAtom = getSalonCoreAtom(clerkId);
  const cachedSalonCore = useAtomValue(salonCoreAtom);
  const setCachedSalonCore = useSetAtom(salonCoreAtom);
  
  const salon = useQuery(api.salon.getBySalonId, 
    clerkId ? { salonId: clerkId } : "skip"
  );

  // データ更新のロジック
  useEffect(() => {
    console.log("[DEBUG] useEffect triggered", { salon, cachedSalonCore, clerkId, hasUpdated: hasUpdatedRef.current });
    
    if (hasUpdatedRef.current) return;
    if (hasUpdatedRef.current) {
      console.log("[DEBUG] Skipping update because hasUpdatedRef is true");
      return;
    }
    if (!salon) return;
    console.log("[DEBUG] useEffect triggered", { salon, cachedSalonCore, clerkId, hasUpdated: hasUpdatedRef.current });
    
    if (cachedSalonCore?.clerkId !== clerkId) {
      console.log("[DEBUG] Updating cachedSalonCore due to clerkId mismatch", { cachedClerkId: cachedSalonCore?.clerkId, clerkId });
      setCachedSalonCore(salon);
      hasUpdatedRef.current = true;
      return;
    }
    
    const cachedStr = JSON.stringify(cachedSalonCore);
    const convexStr = JSON.stringify(salon);
    if (cachedStr !== convexStr) {
      console.log("[DEBUG] Updating cachedSalonCore due to JSON mismatch", { cachedStr, convexStr });
      setCachedSalonCore(salon);
      hasUpdatedRef.current = true;
    }else {
      console.log("[DEBUG] No update needed; cached data is equal to queried data");
    }
  }, [salon, clerkId, setCachedSalonCore, cachedSalonCore]);

  // ユーザーIDが変わるたびにフラグをリセット
  useEffect(() => {
    hasUpdatedRef.current = false;
  }, [clerkId]);
  
  const isCurrentSalonCoreCache = cachedSalonCore?.clerkId === clerkId;
  const salonCore = (isCurrentSalonCoreCache && cachedSalonCore) || salon;
  const isLoading = !user ? true : (isCurrentSalonCoreCache && cachedSalonCore ? false : !salon);

  return { clerkUser: user, salonCore, isLoading, isSubscribed: salonCore?.subscriptionStatus === "active" };
}