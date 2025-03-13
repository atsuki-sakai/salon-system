import StaffList from "./StaffList";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";
import { CommonSection } from "@/components/common";
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
      <StaffList />
    </CommonSection>
  );
}
