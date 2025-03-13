import StaffEditForm from "./StaffEditForm";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CommonSection, RequiredSubscribe } from "@/components/common";

interface StaffEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StaffEditPage({ params }: StaffEditPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  return (
    <CommonSection
      title="スタッフ編集"
      backLink={`/dashboard/${id}/staff`}
      backLinkTitle="スタッフ一覧"
    >
      <StaffEditForm />
    </CommonSection>
  );
}
