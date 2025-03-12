"use client";

import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { setCookie } from "@/lib/utils";
import { OriginalBreadcrumb } from "@/components/common/OriginalBreadcrumb";
import { useLiff } from "@/hooks/useLiff";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";
export default function ReservePage() {
  const params = useParams();
  const { liff } = useLiff();
  const id = params.id as string;

  const handleLogin = () => {
    if (!liff?.isInClient()) {
      const session = JSON.stringify({
        storeId: id,
      });
      setCookie(LINE_LOGIN_SESSION_KEY, session, 60);
      liff?.login();
    }
  };

  const breadcrumbItems = [{ label: "予約者情報の設定", href: `` }];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col items-center justify-center mx-4 py-5">
        <div className="flex flex-col gap-3  w-full">
          <OriginalBreadcrumb items={breadcrumbItems} />
          <h1 className="text-2xl font-bold">予約者情報の設定</h1>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-gray-50 max-w-md py-6 mx-auto rounded-md shadow-sm border">
        <p className="text-sm text-slate-600 mb-4 text-center tracking-wide">
          予約者情報を設定するためにLINEログインが必要です。
          <br />
          予約完了の通知はLINEで受け取れます。
        </p>
        <div className="flex justify-center">
          <Button
            className="bg-green-600 px-4 py-2  max-w-sm hover:bg-green-500"
            onClick={handleLogin}
          >
            <span className="text-white font-bold tracking-wider">
              LINEでログイン
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
