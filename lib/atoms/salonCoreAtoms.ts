import { atomWithStorage } from 'jotai/utils';
import { Doc } from '@/convex/_generated/dataModel';

// アトム格納用のマップ
const atomsMap = new Map<string, ReturnType<typeof atomWithStorage<Doc<"salon"> | null>>>();

// 特定のユーザーIDに対するアトムを取得するか作成する
export function getSalonCoreAtom(salonId: string) {
  const cacheKey = salonId ? `salon-core_${salonId}` : "salon-core_anonymous";
  
  if (!atomsMap.has(cacheKey)) {
    atomsMap.set(cacheKey, atomWithStorage<Doc<"salon"> | null>(cacheKey, null));
  }
  
  return atomsMap.get(cacheKey)!;
}

// ログアウト時のクリア関数
export function clearSalonCoreAtoms() {
  if (typeof window === 'undefined') return;
  
  atomsMap.forEach((_, key) => {
    localStorage.removeItem(key);
  });
  
  atomsMap.clear();
} 