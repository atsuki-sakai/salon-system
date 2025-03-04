"use client";

import { Button } from "@/components/ui/button";
import { useLiff } from "@/components/providers/liff-provider";

type Props = {
  params: {
    id: string;
  };
};

export default function ReservePage({ params }: Props) {
  const { liff, isLoggedIn, profile } = useLiff();

  const handleLogin = () => {
    console.log("handleLogin");
    console.log("isLoggedIn", isLoggedIn);
    console.log("profile", profile);
    console.log("liff?.isInClient()", liff?.isInClient());

    console.log("salonId: ", params.id);

    // 現在のURLを複製
    const currentUrl = new URL(window.location.href);

    // URLから既存のクエリパラメータを削除
    // LIFFは内部的にliff.stateを使うので、余計なパラメータを消しておく
    currentUrl.search = "";

    // パスの一部としてsalonIdを含める（liff.stateとの重複を避けるため）
    // 例: /reserve/salonId123 のようなパス形式
    let pathWithoutTrailingSlash = currentUrl.pathname;
    if (pathWithoutTrailingSlash.endsWith("/")) {
      pathWithoutTrailingSlash = pathWithoutTrailingSlash.slice(0, -1);
    }

    // // パスにsalonIdを含める際は、URLとして有効な文字列にする
    // const encodedSalonId = encodeURIComponent(id);
    currentUrl.pathname = `${pathWithoutTrailingSlash}`;

    // この時点では、URLにクエリパラメータは含まれていない状態
    console.log("リダイレクト先URLのベース: ", currentUrl.toString());

    // LIFFログイン - 内部的にliff.stateを生成する
    liff?.login({
      redirectUri: currentUrl.toString() + `/calender?salonId=${params.id}`,
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
