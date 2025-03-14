import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";
import Calendar from "./Calendar";

interface CalendarPageProps {
  params: Promise<{ id: string }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { id } = await params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (!isSubscribed) {
    return <RequiredSubscribe salonId={id as Id<"salon">} />;
  }
  return <Calendar />;
}
