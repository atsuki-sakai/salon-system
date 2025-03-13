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
  size?: number; // 基本サイズ（デフォルト: 44px）
  aspectRatio?: number; // 幅/高さの比率（デフォルト: 1.5）
  fullSize?: boolean; // 画像を親要素に合わせるかどうか
  minHeight?: number; // 最小高さ（デフォルト: 80px）
  className?: string; // 追加のクラス名
  onLoadComplete?: () => void; // 画像読み込み完了時のコールバック
  showErrorFeedback?: boolean; // エラー時にユーザーにフィードバックを表示するかどうか
};

function FileImageComponent({
  fileId,
  alt,
  size = 44, // デフォルトサイズを明示的に設定
  aspectRatio = 1.5, // デフォルトのアスペクト比を設定
  fullSize = false,
  minHeight = 80, // デフォルトの最小高さを設定
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

  // 画像の高さと幅の計算
  const imageHeight = size;
  const imageWidth = Math.round(size * aspectRatio);

  // 最小の高さを設定
  const calculatedMinHeight = Math.max(minHeight, imageHeight);

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

  // setIsLoadingは冗長になるため削除
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

  return (
    <div
      className={`relative ${isLoading ? "bg-slate-200 animate-pulse" : ""} ${className}`}
      style={{
        minHeight: `${calculatedMinHeight}px`,
        width: fullSize ? "100%" : `${imageWidth}px`,
      }}
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
          width={imageWidth}
          height={imageHeight}
          placeholder="blur"
          blurDataURL={DEFAULT_IMAGE_URL}
          className={`
            ${fullSize ? "w-full h-auto object-center" : `rounded-full object-cover`}
            ${isLoading ? "opacity-0" : "opacity-100"}
            transition-opacity duration-300
          `}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          priority={isImageCached}
          loading={isImageCached ? "eager" : "lazy"}
          sizes={fullSize ? "100vw" : `${imageWidth}px`}
        />
      )}
    </div>
  );
}

// コンポーネントをメモ化して不要な再レンダリングを防止
const FileImage = memo(FileImageComponent);

export default FileImage;