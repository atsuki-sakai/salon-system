import StaffList from "./StaffList";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";
import { CommonSection } from "@/components/common";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

              <p>スタッフ専用管理ページ</p>
            </CardTitle>
            <CardDescription className="text-blue-500">
              シフト管理・休暇をスタッフが管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg 
                              hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 
                              focus:ring-blue-500 focus:ring-offset-2"
                >
                  <LucideCalendarClock className="h-5 w-5" />
                  {`${process.env.NEXT_PUBLIC_URL}/staff-auth/${id}`}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>シフト管理ページにアクセス</p>
              </TooltipContent>
            </Tooltip>

            <p className="text-slate-700 text-sm mt-2">
              こちらからシフトの作成や休暇の管理を行なってください。
              <span className="hidden sm:inline text-slate-500 text-sm ml-2">
                （PINコードとメールアドレスの設定が必要です）
              </span>
            </p>
          </CardContent>
        </Card>
      </TooltipProvider>
      <StaffList />
    </CommonSection>
  );
}
