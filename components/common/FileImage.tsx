"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// デフォルト画像（例）
const DEFAULT_STAFF_IMAGE = "https://placehold.co/44x44";

type FileImageProps = {
  fileId?: string; // スタッフの imageFile（ファイルID）
  alt?: string;
  size?: number;
};

export default function FileImage({ fileId, alt, size }: FileImageProps) {
  // ファイルIDがなければデフォルト画像を使用
  const imageUrl = useQuery(api.storage.getUrl, {
    storageId: fileId || "",
  });

  // query の結果はキャッシュされるので、同じファイルIDの場合は再利用される
  return (
    <Image
      src={fileId && imageUrl ? imageUrl : DEFAULT_STAFF_IMAGE}
      alt={alt || "スタッフ画像"}
      width={size || 44}
      height={size || 44}
      className={`size-${size || 44} rounded-full object-cover`}
    />
  );
}
