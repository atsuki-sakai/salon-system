import SettingEditForm from "./SettingEditForm";
import { RequiredSubscribe, CommonSection } from "@/components/common";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SettingPageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingPage({ params }: SettingPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });
  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as string} />;
  }
  return (
    <CommonSection
      title="サロン設定"
      backLink="/dashboard"
      backLinkTitle="ダッシュボード"
    >
      <SettingEditForm />
    </CommonSection>
  );
}
