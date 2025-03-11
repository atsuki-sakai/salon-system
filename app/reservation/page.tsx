// app/reservation/page.tsx
"use client";

import { useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";
import { LINE_LOGIN_SESSION_KEY } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
// import { useRouter } from "next/navigation";
export default function ReserveRedirectPage() {
  console.log("liff");

  const { liff, isLoggedIn, profile: userProfile } = useLiff();
  // const router = useRouter();
  useEffect(() => {
    const initLiff = async () => {
      if (liff?.isLoggedIn()) {
        console.log("isLoggedIn", isLoggedIn);
        const profile = await liff?.getProfile();
        console.log("liff profile", profile);
        console.log("userProfile", userProfile);
        const session = getCookie(LINE_LOGIN_SESSION_KEY);
        if (session) {
          const { storeId } = JSON.parse(session);
          if (storeId) {
            const redirectUrl = `/reservation/${storeId}/calendar`;
            console.log("redirectUrl", redirectUrl);
            // router.push(redirectUrl);
          } else {
            console.log("storeId is not found");
            // router.push("/");
          }
        } else {
          console.log("session is not found");
          // router.push("/");
        }
      }
    };

    initLiff();
  }, [liff]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <span className="text-2xl font-bold">Redirecting...</span>
    </div>
  );
}
