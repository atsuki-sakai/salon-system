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

export const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; ${
    process.env.NODE_ENV === "production" ? "secure;" : ""
  }`;
};

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

export const generateUid = (key: string) => {
  // 16バイト（128ビット）のランダムな値を生成
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  // バイト列を16進数文字列に変換
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return key + "_" + hexString;
};

export function createFullDateTime(dateStr: string, timeStr: string): string {
  // dateStrが既にISO形式（YYYY-MM-DD）であることを前提
  const datePart = dateStr.split("T")[0]; // もしdateStrがISO形式の場合、Tより前の部分を取得

  // timeStrがHH:MM形式であることを前提
  // ISO形式のタイムスタンプ（YYYY-MM-DDTHH:MM）を生成
  return `${datePart}T${timeStr}`;
}
