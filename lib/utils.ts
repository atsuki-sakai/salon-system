import Stripe from "stripe";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from "crypto-js";

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


const SECRET_KEY = process.env.NEXT_PUBLIC_COOKIE_SECRET_KEY!; // 適切な秘密鍵を設定してください

export const setCookie = (name: string, value: string, days: number) => {
  // 値を暗号化する
  const encryptedValue = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encryptedValue}; expires=${expires}; path=/; ${
    process.env.NODE_ENV === "production" ? "secure;" : ""
  }`;
};

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const encryptedValue = parts.pop()?.split(";").shift();
    if (encryptedValue) {
      try {
        // 暗号化された値を復号する
        const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedData;
      } catch (error) {
        console.error("Cookie の復号に失敗しました", error);
      }
    }
  }
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

