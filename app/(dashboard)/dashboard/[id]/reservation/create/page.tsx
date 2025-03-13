import ReservationCreateForm from "./ReservationCreateForm";
import { CommonSection, RequiredSubscribe } from "@/components/common";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ReservationCreatePageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationCreatePage({
  params,
}: ReservationCreatePageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  return (
    <CommonSection
      title="新規予約作成"
      backLink={`/dashboard/${id}/reservation`}
      backLinkTitle="予約一覧"
    >
      <ReservationCreateForm />
    </CommonSection>
  );
}
