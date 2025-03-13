import { ReservationInfoBanner } from "@/components/common";
import { Separator } from "@/components/ui/separator";
import TodayReservations from "@/components/common/TodayReservations";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe, CommonSection } from "@/components/common";

interface DashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as Id<"salon">} />;
  }

  return (
    <CommonSection
      title="ダッシュボード"
      backLink="/dashboard"
      backLinkTitle="ダッシュボード"
    >
      <ReservationInfoBanner salonId={id as string} />
      <Separator className="my-8 w-[50%] mx-auto" />
      <TodayReservations salonId={id as string} />
    </CommonSection>
  );
}
