"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiffProvider } from "./LiffProvider";
import { Loading } from "@/components/common";

interface DynamicLiffProviderProps {
  children: React.ReactNode;
  salonId: string;
}

export function DynamicLiffProvider({
  children,
  salonId,
}: DynamicLiffProviderProps) {
  const [liffId, setLiffId] = useState<string | null>(null);

  // salonIdをログ出力して確認
  console.log("使用しているsalonId:", salonId);

  // データベースのロード状態も確認するようにする
  const dbLiffId = useQuery(api.salon_config.getLiffId, { salonId });

  console.log("dbLiffId:", dbLiffId);
  console.log(
    "dbLiffId type:",
    dbLiffId !== undefined ? typeof dbLiffId : "undefined"
  );

  useEffect(() => {
    console.log("useEffect内 dbLiffId:", dbLiffId);

    if (dbLiffId) {
      console.log("dbLiffIdが存在する場合、セット:", dbLiffId);
      setLiffId(dbLiffId);
    }
  }, [dbLiffId]);

  console.log("最終liffId:", liffId);
  if (!liffId) {
    console.log("liffIdが存在しない場合、Loadingを表示");
    // LIFF IDがロード中、またはデータベースとフォールバックの両方で見つからない場合
    return <Loading />;
  }

  return <LiffProvider liffId={liffId}>{children}</LiffProvider>;
}

// Suspenseを使用したラッパーコンポーネント
export function DynamicLiffProviderWithSuspense(
  props: DynamicLiffProviderProps
) {
  return <DynamicLiffProvider {...props} />;
}
