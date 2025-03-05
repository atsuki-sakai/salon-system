import { atomWithStorage } from 'jotai/utils';
import { UserDetails } from '@/hooks/useUserDetail';

// アトム格納用のマップ
const atomsMap = new Map<string, ReturnType<typeof atomWithStorage<UserDetails>>>();

// 特定のユーザーIDに対するアトムを取得するか作成する
export function getUserDetailsAtom(userId: string) {
  const cacheKey = userId ? `userDetails_${userId}` : "userDetails_anonymous";
  
  if (!atomsMap.has(cacheKey)) {
    atomsMap.set(cacheKey, atomWithStorage<UserDetails>(cacheKey, null));
  }
  
  return atomsMap.get(cacheKey)!;
}

// ログアウト時のクリア関数
export function clearUserDetailsAtoms() {
  if (typeof window === 'undefined') return;
  
  atomsMap.forEach((_, key) => {
    localStorage.removeItem(key);
  });
  
  atomsMap.clear();
} 