import StaffList from "./StaffList";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";
import { CommonSection } from "@/components/common";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideShieldCheck, LucideCalendarClock } from "lucide-react";
interface StaffListPageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffListPage({ params }: StaffListPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });
  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as Id<"salon">} />;
  }
  return (
    <CommonSection
      title="スタッフ管理"
      backLink="/dashboard"
      backLinkTitle="ダッシュボード"
      infoBtn={{
        text: "スタッフを追加",
        link: `/dashboard/${id}/staff/create`,
      }}
    >
      <TooltipProvider>
        <Card className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <LucideShieldCheck className="h-5 w-5 text-blue-600" />
              <p>スタッフの方はこちらからログイン</p>
            </CardTitle>
            <CardDescription className="text-blue-500">
              シフト管理・休暇をスタッフが管理できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="inline-flex text-sm tracking-wide items-center border bg-white border-blue-600 rounded-lg p-2 text-blue-600">
              <LucideCalendarClock className="h-5 w-5 mr-2" />
              {`${process.env.NEXT_PUBLIC_URL}/staff/login`}
            </p>

            <p className="text-slate-700 text-xs mt-2">
              ログインの際はPINコードとメールアドレスが必要です。
            </p>
          </CardContent>
        </Card>
      </TooltipProvider>
      <StaffList />
    </CommonSection>
  );
}
