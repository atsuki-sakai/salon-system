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
    <main className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ClerkProvider>
          <Sidebar>{children}</Sidebar>
        </ClerkProvider>
      </div>
    </main>
  );
}
