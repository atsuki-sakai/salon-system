"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useCallback, useEffect, memo, useRef } from "react";

// デフォルト画像（例）
const DEFAULT_STORAGE_ID = "kg2367b6zn3j7zqm5fbvc1ea817bmznn";
const DEFAULT_IMAGE_URL = "https://placehold.co/44x44";
const FALLBACK_IMAGE_URL =
  "https://placehold.co/44x44/ff0000/ffffff?text=Error";

/**
 * 画像のプリロード状態を追跡するためのキャッシュ
 * アプリケーション全体で共有されるため、コンポーネントがアンマウントされても状態は保持される
 */
const imageLoadedCache = new Map<string, boolean>();

type FileImageProps = {
  fileId?: string; // スタッフの imageFile（ファイルID）
  alt?: string;
  size?: number; // 円の直径（デフォルト: 44px）
  fullSize?: boolean; // 画像を親要素に合わせるかどうか
  minHeight?: number; // 最小高さ（デフォルト: 80px）、fullSize=trueの時のみ使用
  className?: string; // 追加のクラス名
  onLoadComplete?: () => void; // 画像読み込み完了時のコールバック
  showErrorFeedback?: boolean; // エラー時にユーザーにフィードバックを表示するかどうか
};

function FileImageComponent({
  fileId,
  alt,
  size = 44, // デフォルトサイズを明示的に設定
  fullSize = false,
  minHeight = 80, // デフォルトの最小高さを設定（fullSize=trueの時のみ使用）
  className = "",
  onLoadComplete,
  showErrorFeedback = false,
}: FileImageProps) {
  const cacheKey = fileId || DEFAULT_STORAGE_ID;
  const isImageCached = imageLoadedCache.has(cacheKey);
  const [isLoading, setIsLoading] = useState(!isImageCached);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  // ファイルIDがなければデフォルト画像を使用
  const imageUrl = useQuery(api.storage.getUrl, {
    storageId: cacheKey,
  });

  // コンポーネントのアンマウント時にフラグを更新
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 円形表示の場合は幅と高さが同じ値になる（正方形）
  const circleDimension = size;

  // 最小の高さを設定（fullSize=trueの場合のみ使用）
  const calculatedMinHeight = Math.max(minHeight, circleDimension);

  // 画像をプリロード
  useEffect(() => {
    if (imageUrl && !isImageCached) {
      const preloadImage = new window.Image();
      preloadImage.src = imageUrl;

      // プリロード完了時の処理
      preloadImage.onload = () => {
        imageLoadedCache.set(cacheKey, true);
        // コンポーネントがまだマウントされていれば状態を更新
        if (isMounted.current) {
          setIsLoading(false);
          if (onLoadComplete) {
            onLoadComplete();
          }
        }
      };

      // プリロードエラー時の処理
      preloadImage.onerror = () => {
        if (isMounted.current) {
          setHasError(true);
          setIsLoading(false);
          console.warn(`Failed to preload image: ${cacheKey}`);
        }
      };
    }
  }, [imageUrl, isImageCached, cacheKey, onLoadComplete]);

  const handleLoadStart = useCallback(() => {
    // すでにキャッシュされている場合はローディング状態にしない
    if (!isImageCached && !hasError) {
      setIsLoading(true);
    }
  }, [isImageCached, hasError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    imageLoadedCache.set(cacheKey, true);
    if (onLoadComplete) {
      onLoadComplete();
    }
  }, [cacheKey, onLoadComplete]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.warn(`Failed to load image: ${cacheKey}`);
  }, [cacheKey]);

  // 実際に表示する画像URLを決定
  const displayImageUrl = hasError
    ? FALLBACK_IMAGE_URL
    : imageUrl || DEFAULT_IMAGE_URL;

  // fullSizeモードと円形モードで異なるスタイルを適用
  return (
    <div
      className={`relative ${isLoading ? "bg-slate-200 animate-pulse" : ""} ${className}`}
      style={
        fullSize
          ? {
              // fullSizeモードの場合は親要素に合わせる
              minHeight: `${calculatedMinHeight}px`,
              width: "100%",
            }
          : {
              // 円形モードの場合は正方形コンテナを作成
              width: `${circleDimension}px`,
              height: `${circleDimension}px`,
              borderRadius: "50%", // コンテナ自体も円形に
              overflow: "hidden", // はみ出した部分を隠す
            }
      }
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {hasError && showErrorFeedback && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-50">
          <div className="text-red-500 text-xs text-center px-2">
            画像の読み込みに失敗しました
          </div>
        </div>
      )}

      {imageUrl && (
        <Image
          src={displayImageUrl}
          alt={alt || "alt image"}
          width={fullSize ? undefined : circleDimension}
          height={fullSize ? undefined : circleDimension}
          placeholder="blur"
          blurDataURL={DEFAULT_IMAGE_URL}
          className={`
            ${
              fullSize
                ? "w-full h-auto object-center"
                : "w-full h-full object-cover rounded-full"
            }
            ${isLoading ? "opacity-0" : "opacity-100"}
            transition-opacity duration-300
          `}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          priority={isImageCached}
          loading={isImageCached ? "eager" : "lazy"}
          sizes={fullSize ? "100vw" : `${circleDimension}px`}
          style={
            !fullSize
              ? {
                  objectPosition: "center", // 画像の中心を表示
                }
              : undefined
          }
          fill={fullSize} // fullSizeモードの場合はfillを使用
        />
      )}
    </div>
  );
}

// コンポーネントをメモ化して不要な再レンダリングを防止
const FileImage = memo(FileImageComponent);

export default FileImage;