// app/reservation/page.tsx
"use client";

import { useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import { useRouter } from "next/navigation";
export default function ReserveRedirectPage() {
  const { liff } = useLiff();
  const router = useRouter();
  useEffect(() => {
    const session = getCookie(LINE_LOGIN_SESSION_KEY);
    if (session) {
      const parsedSession = JSON.parse(session);
      console.log("parsedSession", parsedSession);
      router.push(`/reservation/${parsedSession.storeId}/calendar`);
    }
  }, [liff, router]);
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <span className="text-2xl font-bold">Redirecting...</span>
    </div>
  );
}
