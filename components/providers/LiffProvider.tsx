"use client";

import React, { createContext, useEffect, useState } from "react";
import liff from "@line/liff";

type LiffContextType = {
  liff: typeof liff | null;
};

export const LiffContext = createContext<LiffContextType>({
  liff: null,
});

export function LiffProvider({
  children,
  liffId,
}: {
  children: React.ReactNode;
  liffId: string;
}) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({
          liffId,
        });
        setLiffObject(liff);
      } catch (error) {
        console.error("LIFF initialization failed", error);
      }
    };

    initLiff();
  }, [liffId]);

  return (
    <LiffContext.Provider value={{ liff: liffObject }}>
      {children}
    </LiffContext.Provider>
  );
}
