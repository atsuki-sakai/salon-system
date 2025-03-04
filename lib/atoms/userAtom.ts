import { atomWithStorage } from 'jotai/utils';

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