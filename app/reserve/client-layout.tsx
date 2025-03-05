"use client";

import { LiffProvider } from "@/components/providers/liff-provider";
const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!liffId) {
    console.error("LIFF ID is not configured");
    return null;
  }

  return <LiffProvider liffId={liffId}>{children}</LiffProvider>;
}
