"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
// デフォルト画像（例）
const DEFAULT_STORAGE_ID = "kg2367b6zn3j7zqm5fbvc1ea817bmznn";
const DEFAULT_IMAGE_URL = "https://placehold.co/44x44";

type FileImageProps = {
  fileId?: string; // スタッフの imageFile（ファイルID）
  alt?: string;
  size?: number;
  fullSize?: boolean;
};

export default function FileImage({
  fileId,
  alt,
  size,
  fullSize,
}: FileImageProps) {
  // ファイルIDがなければデフォルト画像を使用
  const imageUrl = useQuery(api.storage.getUrl, {
    storageId: fileId || DEFAULT_STORAGE_ID,
  });

  // query の結果はキャッシュされるので、同じファイルIDの場合は再利用される
  return (
    <Image
      src={imageUrl || DEFAULT_IMAGE_URL}
      alt={alt || "スタッフ画像"}
      width={size ? size * 1.5 : 44}
      height={size ? size * 1 : 44}
      placeholder="blur"
      blurDataURL={DEFAULT_IMAGE_URL}
      className={`  ${fullSize ? "w-full h-auto object-center" : "rounded-full object-cover size-${size || 44}"}`}
    />
  );
}
