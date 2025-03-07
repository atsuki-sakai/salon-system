import { atomWithStorage } from 'jotai/utils';
import { Doc } from '@/convex/_generated/dataModel';

// Atomの定義：localStorageに保存してキャッシュを有効化
export const salonCoreAtom = atomWithStorage<Doc<"salon"> | null>('salon-core', null);

// キャッシュキーをユーザーIDごとに分ける
export function getSalonCoreCacheKey(salonId: string) {
  return `salon-core_${salonId}`;
}

// ログアウト時に呼び出すキャッシュクリア関数
export function clearSalonCoreCache() {
  // localStorage からユーザー関連のデータをすべて削除
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('salon-core_')) {
      localStorage.removeItem(key);
    }
  }
}