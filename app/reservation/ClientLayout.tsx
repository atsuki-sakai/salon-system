"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DynamicLiffProviderWithSuspense } from "@/components/providers/DynamicLiffProvider";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { Loading } from "@/components/common";
import { getCookie } from "@/lib/utils";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";

interface ClientLayoutProps {
  children: React.ReactNode;
  fontVariables: NextFontWithVariable[];
}

export function ClientLayout({ children, fontVariables }: ClientLayoutProps) {
  const [salonId, setSalonId] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    // パスからサロンIDを取得
    if (pathname && pathname.startsWith("/reservation/")) {
      const pathSalonId = pathname.replace("/reservation/", "");
      if (pathSalonId && pathSalonId !== "") {
        setSalonId(pathSalonId);
        return;
      }
    }
    const sessionCookie = getCookie(LINE_LOGIN_SESSION_KEY);
    if (sessionCookie) {
      const { salonId } = JSON.parse(sessionCookie);
      setSalonId(salonId);
    }
  }, [pathname]);

  if (!salonId) {
    return <Loading />;
  }
  return (
    <DynamicLiffProviderWithSuspense salonId={salonId}>
      <div
        className={`${fontVariables.map((font) => font.className).join(" ")} antialiased`}
      >
        {children}
      </div>
    </DynamicLiffProviderWithSuspense>
  );
}
