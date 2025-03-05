"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";
import { Loading } from "@/components/common";
type LiffContextType = {
  liff: typeof liff | null;
  isLoggedIn: boolean;
  profile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    email?: string;
  } | null;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  profile: null,
});

export function LiffProvider({
  children,
  liffId,
}: {
  children: React.ReactNode;
  liffId: string;
}) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffContextType["profile"]>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initLiff = async () => {
      if (
        typeof window !== "undefined" &&
        !window.location.href.includes("liff")
      ) {
        setIsInitialized(true);
        return;
      }

      try {
        console.log("Initializing LIFF with ID:", liffId);
        const liffInstance = await import("@line/liff").then(
          (module) => module.default
        );

        await liffInstance.init({
          liffId: liffId,
          withLoginOnExternalBrowser: false,
        });

        console.log("LIFF initialized successfully");

        if (mounted) {
          setLiffObject(liffInstance);
          const loggedIn = liffInstance.isLoggedIn();
          console.log("Login status after init:", loggedIn);
          setIsLoggedIn(loggedIn);

          if (loggedIn) {
            try {
              const userProfile = await liffInstance.getProfile();
              console.log("Retrieved user profile:", userProfile);
              setProfile({
                userId: userProfile.userId,
                displayName: userProfile.displayName,
                pictureUrl: userProfile.pictureUrl,
                email: liffInstance.getDecodedIDToken()?.email,
              });
            } catch (profileError) {
              console.error("Error getting profile:", profileError);
            }
          }
        }
      } catch (error) {
        console.error("LIFF initialization failed:", error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    if (liffId) {
      initLiff();
    } else {
      console.error("LIFF ID is not provided");
    }

    return () => {
      mounted = false;
    };
  }, [liffId]);

  if (!isInitialized) {
    return <Loading />;
  }

  return (
    <LiffContext.Provider value={{ liff: liffObject, isLoggedIn, profile }}>
      {children}
    </LiffContext.Provider>
  );
}

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
};
