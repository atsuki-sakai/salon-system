import SubscriptionCard from "./subscriptionCard";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";

interface SubscriptionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubscriptionPage({
  params,
}: SubscriptionPageProps) {
  const { id } = await params;

  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (!isSubscribed) {
    return <RequiredSubscribe salonId={id as string} />;
  }

  return <SubscriptionCard />;
}
