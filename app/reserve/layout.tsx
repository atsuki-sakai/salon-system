import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "../../app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ClientLayout from "./client-layout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ClientLayout>{children}</ClientLayout>
        </ClerkProvider>
        <Toaster
          position="top-right"
          expand={false}
          richColors
          duration={5000}
        />
      </body>
    </html>
  );
}
