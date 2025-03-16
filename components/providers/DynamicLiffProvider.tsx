"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiffProvider } from "./LiffProvider";
import { Loading } from "@/components/common";

// ストレージキー（サロンIDごとに異なるキーを生成）
const getStorageKey = (salonId: string) => `liff_id_${salonId}`;

interface DynamicLiffProviderProps {
  children: React.ReactNode;
  salonId: string;
}

export function DynamicLiffProvider({
  children,
  salonId,
}: DynamicLiffProviderProps) {
  const [liffId, setLiffId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Convexクライアントの取得 - 接続状態を確認するために使用
  const convex = useConvex();

  // salonIdをログ出力して確認
  console.log("使用しているsalonId:", salonId);

  // 1. 初期化時にキャッシュから読み込み
  useEffect(() => {
    if (!salonId) {
      setErrorMessage("サロンIDが不明です");
      setShowError(true);
      return;
    }

    let hasLocalStorageAccess = false;
    
    // まずローカルストレージへのアクセスが可能か確認
    try {
      // テストキーで書き込みテスト
      const testKey = `test_storage_${Date.now()}`;
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      hasLocalStorageAccess = true;
      console.log("ローカルストレージアクセス: 成功");
    } catch (err) {
      console.warn("ローカルストレージアクセス不可:", err);
      hasLocalStorageAccess = false;
    }

    // ローカルストレージにアクセスできる場合のみキャッシュを試す
    if (hasLocalStorageAccess) {
      try {
        // キャッシュされたLIFF IDを確認
        const storageKey = getStorageKey(salonId);
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // キャッシュの有効期限をチェック（24時間）
          const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          if (isValid && parsed.liffId) {
            console.log("キャッシュからLIFF IDを復元:", parsed.liffId);
            setLiffId(parsed.liffId);
          } else {
            // 期限切れの場合はキャッシュを削除
            localStorage.removeItem(storageKey);
          }
        }
      } catch (err) {
        console.error("キャッシュ読み込みエラー:", err);
      }
    }
  }, [salonId]);

  // 2. Convex接続状態とクエリの実行
  // 接続状態を確認（connectionStateの型エラーを回避するため同値チェックではなく接続状態の存在確認に変更）
  const isConnected = !!convex && convex.connectionState !== undefined;
  console.log("Convex接続状態:", convex?.connectionState);

  // 3. 接続状態に関わらずクエリを実行（効率的なリトライ処理に任せる）
  const dbLiffId = useQuery(
    api.salon_config.getLiffId,
    salonId ? { salonId } : "skip"
  );

  console.log("dbLiffId:", dbLiffId);
  console.log(
    "dbLiffId type:",
    dbLiffId !== undefined ? typeof dbLiffId : "undefined"
  );

  // 4. クエリ結果の処理とリトライロジック
  useEffect(() => {
    // dbLiffId が undefined の場合、まだクエリ実行中か失敗している可能性がある
    if (dbLiffId === undefined) {
      // リトライ回数に達していない場合のみ処理
      if (retryCount < 5) {
        const timer = setTimeout(() => {
          console.log(`LIFFIDの取得をリトライします (${retryCount + 1}/5)`);
          setRetryCount((prev) => prev + 1);
        }, 2000);

        return () => clearTimeout(timer);
      } else {
        console.error("LIFF IDの取得に失敗しました");
        setErrorMessage(
          "このサロンのLINE連携情報を取得できませんでした。管理者にお問い合わせください。"
        );
        setShowError(true);
      }
      return;
    }

    // dbLiffIdが取得できた場合、保存と設定
    if (dbLiffId) {
      console.log("dbLiffIdが取得できました:", dbLiffId);
      setLiffId(dbLiffId);
      setShowError(false);

      // キャッシュに保存
      try {
        // まずローカルストレージへのアクセスが可能か確認
        const testKey = `test_storage_${Date.now()}`;
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        
        // アクセス可能なら本来のデータを保存
        const storageKey = getStorageKey(salonId);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            liffId: dbLiffId,
            timestamp: Date.now(),
          })
        );
        console.log("LIFFIDをキャッシュに保存しました");
      } catch (err) {
        console.error("キャッシュ保存エラー:", err);
      }
    }
    // nullが明示的に返された場合（サロンIDは正しいがLIFF IDが設定されていない）
    else if (dbLiffId === null) {
      console.error("LIFF IDが設定されていません");
      setErrorMessage(
        "このサロンにはLINE連携が設定されていません。管理者にお問い合わせください。"
      );
      setShowError(true);
    }
  }, [dbLiffId, retryCount, salonId]);

  console.log("最終liffId:", liffId);

  // エラー表示
  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-red-600 text-xl font-bold mb-4">
            エラーが発生しました
          </h2>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング表示
  if (!liffId) {
    console.log("liffIdが存在しない場合、Loadingを表示");
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
