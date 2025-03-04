"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useLiff } from "@/components/providers/liff-provider";

export function Profile({ id }: { id: string }) {
  const { liff, isLoggedIn, profile } = useLiff();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLogout = () => {
    liff?.logout();
    window.location.href = "/reserve/" + id;
  };

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
    // liff?.login({
    //   redirectUri: currentUrl.toString(),
    // });
  };

  const handleUpdate = async () => {
    if (!profile?.userId || !phoneNumber) return;

    // try {
    //   const response = await fetch(`/api/customer/${profile.userId}`, {
    //     method: "PUT",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       phone: phoneNumber,
    //     }),
    //   });

    //   if (response.ok) {
    //     alert("情報を更新しました");
    //   } else {
    //     alert("更新に失敗しました");
    //   }
    // } catch (error) {
    //   console.error("更新エラー:", error);
    //   alert("エラーが発生しました");
    // }
  };

  const handleRegister = async () => {
    if (!profile?.userId || !phoneNumber) return;

    try {
      // const response = await fetch(`/api/customer/${profile.userId}`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     name: profile.displayName,
      //     phone: phoneNumber,
      //     destination: "",
      //   }),
      // });
      // if (response.ok) {
      //   alert("登録が完了しました");
      // } else {
      //   alert("登録に失敗しました");
      // }
    } catch (error) {
      console.error("登録エラー:", error);
      alert("エラーが発生しました");
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value || "");
  };

  const [lineId, setLineId] = useState<string | null>(null);

  useEffect(() => {
    if (!liff) {
      console.log("LIFF is not initialized yet", {
        liffObject: liff,
        envLiffId: process.env.NEXT_PUBLIC_LIFF_ID,
      });
      return;
    }

    console.log("LIFF status:", {
      isInitialized: !!liff,
      isLoggedIn: isLoggedIn,
      profile: profile,
      liffId: process.env.NEXT_PUBLIC_LIFF_ID,
    });

    if (isLoggedIn && profile) {
      console.log("Setting lineId from profile:", profile.userId);
      setLineId(profile.userId);
    }
  }, [liff, isLoggedIn, profile]);

  const customer = useQuery(
    api.customers.getCustomerByLineId,
    lineId ? { lineId } : "skip"
  );

  const createCustomer = useMutation(api.customers.createCustomer);
  useEffect(() => {
    if (customer) {
      console.log("customer", customer);
    }
    console.log("customer", customer);
    console.log("profile?.userId", profile?.userId);
    console.log("id", id);
    if (!customer && profile?.userId && id) {
      console.log("customer is null, creating new customer with salonId:", id);
      createCustomer({
        lineId: profile.userId,
        email: profile.email ?? "",
        phone: "",
        name: profile.displayName ?? "",
        salonId: id,
      });
    }
  }, [customer, createCustomer, id, profile]);

  return (
    <Card className="w-full max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Line予約</CardTitle>
      </CardHeader>
      <CardContent>
        {profile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                />
                <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{profile.displayName}</h3>
                {profile.email && (
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
              />
            </div>

            <div className="flex justify-center gap-2">
              <Button
                variant="default"
                onClick={handleRegister}
                className="w-2/5 bg-green-600 font-bold text-white"
              >
                登録
              </Button>
              <Button
                variant="default"
                onClick={handleUpdate}
                className="w-2/5 font-bold bg-gray-500 text-white"
              >
                更新
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-1/5 font-bold text-white"
              >
                ログアウト
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="bg-green-600 font-bold text-white"
            onClick={handleLogin}
          >
            LINEでログイン
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
