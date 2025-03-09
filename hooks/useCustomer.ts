import type { CustomerSession } from "@/lib/types";
import { getCookie } from "@/lib/utils";
import { SESSION_KEY } from "@/lib/constants";


/**
 * 型ガード関数で安全性を確保 - useCustomer内部でのみ使用する関数
 */
const isCustomerSession = (data: unknown): data is CustomerSession => {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as CustomerSession)._id === "string" &&
    typeof (data as CustomerSession).firstName === "string" &&
    typeof (data as CustomerSession).lastName === "string" &&
    typeof (data as CustomerSession).phone === "string" &&
    typeof (data as CustomerSession).email === "string"
  );
};

/**
 * カスタマーセッション情報を取得するカスタムフック
 * @returns {Object} sessionData - 顧客セッションデータまたはnull
 */
export const useCustomer = () => {
  try {
    const cookieData = getCookie(SESSION_KEY);

    console.log("cookieData", cookieData);
    // Cookieが存在しない場合はnullを返す
    if (!cookieData) {
      return { sessionData: null };
    }

    // JSON.parseでパースし、安全に型チェック
    try {
      const parsedData = JSON.parse(cookieData);
      if (isCustomerSession(parsedData)) {
        return { cookieData: parsedData };
      }

      // 型が一致しない場合はnullを返す
      console.warn("Invalid session data format");
    } catch (parseError) {
      // JSON.parseエラー処理
      console.error("Failed to parse session data:", parseError);
    }
    return { cookieData: null };
  } catch (error) {
    // その他の例外処理
    console.error("Error in useCustomer hook:", error);
    return { cookieData: null };
  }
};
