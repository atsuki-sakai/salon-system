import StaffCreateForm from "./StaffCreateForm";
import { CommonSection, RequiredSubscribe } from "@/components/common";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface StaffCreatePageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffCreatePage({
  params,
}: StaffCreatePageProps) {
  const { id } = await params;

  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  return (
    <CommonSection
      title="スタッフ作成"
      backLink={`/dashboard/${id}/staff`}
      backLinkTitle="スタッフ一覧"
    >
      <StaffCreateForm />
    </CommonSection>
  );
}
