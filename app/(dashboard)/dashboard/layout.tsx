import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Sidebar } from "@/components/common";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <ClerkProvider>
        <Sidebar>{children}</Sidebar>
      </ClerkProvider>
    </div>
  );
}
