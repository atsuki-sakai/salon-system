import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "スタッフログイン | サロン管理システム",
  description: "サロンスタッフ専用ログイン画面",
};

export default function StaffLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      {children}
    </div>
  );
}
