"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiff } from "@/hooks/useLiff";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";
import { getCookie, setCookie, deleteCookie } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

export default function ReserveRedirectPage() {
  const { liff } = useLiff();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const createCustomer = useMutation(api.customer.add);
  const updateCustomer = useMutation(api.customer.update);

  useEffect(() => {
    async function initLiff() {
      if (!liff?.isLoggedIn()) {
        console.error("LIFF not logged in");
        router.push("/reservation/error");
        return;
      }

      const profile = await liff?.getProfile();
      const sessionCookie = getCookie(LINE_LOGIN_SESSION_KEY);
      if (sessionCookie === null) {
        console.error("Session cookie not found");
        router.push("/reservation/error");
        return;
      }

      const { storeId } = JSON.parse(sessionCookie ?? "");
      if (!storeId) {
        console.error("storeId is missing in session cookie");
        router.push("/reservation/error");
        return;
      }

      const computedRedirectUrl = `/reservation/${storeId}/calendar`;
      setRedirectUrl(computedRedirectUrl);
      deleteCookie(LINE_LOGIN_SESSION_KEY);

      const newSession = JSON.stringify({
        storeId,
        lineId: profile?.userId,
        displayName: profile?.displayName,
      });

      try {
        const existingCustomer = await fetchQuery(
          api.customer.getCustomersByLineId,
          {
            lineId: profile?.userId ?? "",
          }
        );
        const userEmail = liff?.getDecodedIDToken()?.email || "";
        if (!existingCustomer) {
          await createCustomer({
            salonId: storeId,
            lineId: profile?.userId,
            lineUserName: profile?.displayName || "",
            email: userEmail,
            phone: "",
            firstName: "",
            lastName: "",
          });
          console.log("新規顧客を作成しました");
        } else {
          await updateCustomer({
            id: existingCustomer._id,
            lineId: profile?.userId ?? "",
            lineUserName: profile?.displayName || "",
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
      router.push(computedRedirectUrl);
    }

    if (liff) {
      initLiff();
    }
  }, [liff, router, createCustomer, updateCustomer]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center text-blue-800">
            Booker
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            ログイン中のユーザー情報を処理しています。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-white"></div>
            </div>
          </div>
          <p className="text-center text-gray-700 font-medium animate-pulse">
            リダイレクト中...
          </p>
          <p className="text-center text-sm text-gray-500 max-w-xs">
            お客様の情報を確認し、予約ページへ移動しています。しばらくお待ちください。
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="text-xs text-gray-500 text-center">
            画面が切り替わらない場合は下のボタンをクリックしてください
          </div>
          <Button
            variant="default"
            className="w-full flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-500"
            asChild
          >
            <Link href={redirectUrl ?? "#"}>
              <span className="text-white font-bold">予約ページへ移動</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
