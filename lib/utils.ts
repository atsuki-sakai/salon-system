import Stripe from "stripe";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from "crypto-js";
import crypto from 'crypto';
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


const SESSION_SECRET = process.env.NEXT_PUBLIC_COOKIE_SECRET || "";

export const setCookie = (name: string, value: string, days: number) => {
  try {
    // シークレットキーのチェック
    if (!SESSION_SECRET) {
      console.warn("Cookie暗号化キーが設定されていません。平文で保存します。");
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${
        process.env.NODE_ENV === "production" ? "secure;" : ""
      }`;
      return;
    }
    
    // 値を暗号化する
    const encryptedValue = CryptoJS.AES.encrypt(value, SESSION_SECRET).toString();
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encryptedValue}; expires=${expires}; path=/; ${
      process.env.NODE_ENV === "production" ? "secure;" : ""
    }`;
    console.log(`クッキー "${name}" を保存しました。期限: ${expires}`);
  } catch (error) {
    console.error("クッキーの保存中にエラーが発生しました:", error);
    // フォールバック: 平文で保存
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${
      process.env.NODE_ENV === "production" ? "secure;" : ""
    }`;
  }
};

export const getCookie = (name: string) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const rawValue = parts.pop()?.split(";").shift();
      if (!rawValue) return null;
      
      // シークレットキーが設定されていない場合
      if (!SESSION_SECRET) {
        console.warn("Cookie暗号化キーが設定されていません。平文として処理します。");
        return decodeURIComponent(rawValue);
      }
      
      // まず暗号化されたデータとして復号を試みる
      try {
        const bytes = CryptoJS.AES.decrypt(rawValue, SESSION_SECRET);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        
        // 正常に復号できた場合
        if (decryptedData) {
          return decryptedData;
        }
      } catch (decryptError) {
        console.warn(`クッキー "${name}" の復号に失敗しました。平文として処理します:`, decryptError);
        // 復号に失敗した場合、平文として返す
        return decodeURIComponent(rawValue);
      }
    }
    console.log(`クッキー "${name}" が見つかりませんでした。`);
    return null;
  } catch (error) {
    console.error(`クッキー "${name}" の取得中にエラーが発生しました:`, error);
    return null;
  }
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${
    process.env.NODE_ENV === "production" ? "secure;" : ""
  }`;
};

export const generateUid = (key: string) => {
  let hexString = "";
  // ブラウザ環境の場合は window.crypto を利用
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    // 16バイト（128ビット）のランダムな値を生成
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    hexString = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // サーバー環境の場合は node の crypto.randomBytes を利用
    const randomBuffer = crypto.randomBytes(16);
    hexString = randomBuffer.toString("hex");
  }
  return key + "_" + hexString;
};


// 環境変数から暗号化キーを取得（32バイトの16進数文字列であることが必要）
const key = Buffer.from(process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string, 'hex'); // 例: 32バイトのキー
// IVはランダムな16バイトを使用（暗号化のたびに変更し、復号時に利用するため平文で付与する）
const ivLength = 16;
const algorithm = 'aes-256-cbc';

// 暗号化
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // IV と暗号文を ':' で結合（IVは復号に必要）
  return iv.toString('hex') + ':' + encrypted;
}

// 復号
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  
  const ivHex = parts[0];
  const encryptedHex = parts[1];
  
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// URLパスからサロンIDを取得する関数
export function getSalonIdFromPath(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_DEFAULT_SALON_ID || '';
  }
  
  // URLからパスを取得
  const path = window.location.pathname;
  
  // パスからサロンIDを抽出する正規表現パターン
  // 例: /reservation/abc123/calendar のような形式を想定
  const match = path.match(/\/reservation\/([^\/]+)/);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // パスからサロンIDが取得できない場合はデフォルト値を返す
  return process.env.NEXT_PUBLIC_DEFAULT_SALON_ID || '';
}