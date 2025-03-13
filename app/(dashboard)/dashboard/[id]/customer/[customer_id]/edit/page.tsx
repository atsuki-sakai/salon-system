import CustomerEditForm from "./CustomerEditForm";
import { CommonSection } from "@/components/common";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";

interface CustomerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id,
  });

  if (!isSubscribed) {
    return <RequiredSubscribe salonId={id as Id<"salon">} />;
  }

  return (
    <CommonSection
      title="顧客編集"
      backLink={`/dashboard/${id}/customer`}
      backLinkTitle="顧客一覧"
    >
      <CustomerEditForm />
    </CommonSection>
  );
}
