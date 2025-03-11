// app/reservation/page.tsx
"use client";

import { useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";
import { getCookie, setCookie, deleteCookie } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default function ReserveRedirectPage() {
  console.log("liff");

  const { liff } = useLiff();
  const router = useRouter();
  const createCustomer = useMutation(api.customer.add);
  const updateCustomer = useMutation(api.customer.update);

  useEffect(() => {
    const initLiff = async () => {
      if (liff?.isLoggedIn()) {
        const profile = await liff?.getProfile();
        console.log("profile", profile);
        const isLoggedIn = liff?.isLoggedIn();
        console.log("isLoggedIn", isLoggedIn);
        const session = getCookie(LINE_LOGIN_SESSION_KEY);
        if (session) {
          const { storeId } = JSON.parse(session);
          if (storeId) {
            deleteCookie(LINE_LOGIN_SESSION_KEY);
            const newSession = JSON.stringify({
              storeId: storeId,
              lineId: profile.userId,
              displayName: profile.displayName,
            });

            // Customerテーブルにlineユーザーが存在するか確認し、作成または更新する
            try {
              const existingCustomer = await fetchQuery(
                api.customer.getCustomersByLineId,
                {
                  lineId: profile.userId,
                }
              );

              const userEmail = liff.getDecodedIDToken()?.email || "";

              if (!existingCustomer) {
                // 存在しない場合は新規作成
                await createCustomer({
                  salonId: storeId,
                  lineId: profile.userId,
                  lineUserName: profile.displayName ?? "",
                  email: userEmail ?? "",
                  phone: "", // 初期登録時は空
                  firstName: "", // 初期登録時は空
                  lastName: "", // 初期登録時は空
                });
                console.log("新規顧客を作成しました");
              } else {
                // 存在する場合は情報を更新
                await updateCustomer({
                  id: existingCustomer._id,
                  lineId: profile.userId,
                  lineUserName: profile.displayName ?? "",
                  email: existingCustomer.email || userEmail,
                  phone: existingCustomer.phone || "",
                  firstName: existingCustomer.firstName || "",
                  lastName: existingCustomer.lastName || "",
                });
                console.log("既存顧客情報を更新しました");
              }
            } catch (error) {
              console.error("顧客情報の処理中にエラーが発生しました:", error);
            }

            setCookie(LINE_LOGIN_SESSION_KEY, newSession, 60);
            const userEmail = liff.getDecodedIDToken()?.email;
            console.log("userEmail", userEmail);
            const redirectUrl = `/reservation/${storeId}/calendar`;
            console.log("redirectUrl", redirectUrl);
            // router.push(redirectUrl);
          } else {
            console.log("storeId is not found");
            router.push("/");
          }
        } else {
          console.log("session is not found");
          router.push("/");
        }
      }
    };

    initLiff();
  }, [liff]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <span className="text-2xl font-bold">Redirecting...</span>
    </div>
  );
}
