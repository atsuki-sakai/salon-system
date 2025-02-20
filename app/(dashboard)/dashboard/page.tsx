"use client";

import { redirect } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function RedirectDashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  useEffect(() => {
    if (!user || !user.id) {
      signOut();
      router.push("/sign-in");
    } else {
      redirect(`/dashboard/${user.id}`);
    }
  }, [router, user, signOut]);

  return <div>Redirecting...</div>;
}
