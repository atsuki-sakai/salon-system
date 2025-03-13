import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CommonSection, RequiredSubscribe } from "@/components/common";

import EditReservationForm from "./EditReservationForm";
interface EditReservationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditReservationPage({
  params,
}: EditReservationPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as Id<"salon">} />;
  }

  return (
    <CommonSection
      title="予約編集"
      backLink={`/dashboard/${id}/reservation`}
      backLinkTitle="予約一覧"
    >
      <EditReservationForm />
    </CommonSection>
  );
}
