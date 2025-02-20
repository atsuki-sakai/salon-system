import Stripe from "stripe";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSubscriptionStatus(subscription: Stripe.Subscription): string {
  const { status } = subscription;

  // incomplete 状態を active に変換
  if (status === "incomplete") {
    return "active";
  }

  return status;
}

// ヘルパー関数: Unix秒を日付文字列（例："YYYY/M/D"）に変換
export function formatTimestampToDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
