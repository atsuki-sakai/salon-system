"use client";

import { Button } from "@/components/ui/button";
import { useLiff } from "@/components/providers/liff-provider";
import { useParams } from "next/navigation";

export default function ReservePage() {
  const params = useParams();
  const id = params.id as string;
  const { liff, isLoggedIn, profile } = useLiff();

  const handleLogin = () => {
    console.log("handleLogin");
    console.log("isLoggedIn", isLoggedIn);
    console.log("profile", profile);
    console.log("liff?.isInClient()", liff?.isInClient());

    console.log("salonId: ", id);

    // 現在のURLを複製
    const currentUrl = new URL(window.location.href);

    // URLから既存のクエリパラメータを削除
    // LIFFは内部的にliff.stateを使うので、余計なパラメータを消しておく
    currentUrl.search = "";

    // パスの一部としてsalonIdを含める（liff.stateとの重複を避けるため）
    let pathWithoutTrailingSlash = currentUrl.pathname;
    if (pathWithoutTrailingSlash.endsWith("/")) {
      pathWithoutTrailingSlash = pathWithoutTrailingSlash.slice(0, -1);
    }

    currentUrl.pathname = `${pathWithoutTrailingSlash}`;

    console.log("リダイレクト先URLのベース: ", currentUrl.toString());

    // LIFFログイン - 内部的にliff.stateを生成する
    liff?.login({
      redirectUri: currentUrl.toString() + `/calender?salonId=${id}`,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button
        variant="outline"
        className="font-bold bg-green-600 text-white"
        onClick={handleLogin}
      >
        LINEでログイン
      </Button>
    </div>
  );
}
