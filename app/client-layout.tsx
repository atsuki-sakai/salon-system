"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { LiffProvider } from "@/components/providers/liff-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
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

  return (
    <ConvexProvider client={convex}>
      <LiffProvider liffId={liffId}>{children}</LiffProvider>
    </ConvexProvider>
  );
}
