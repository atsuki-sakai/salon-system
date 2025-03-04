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
