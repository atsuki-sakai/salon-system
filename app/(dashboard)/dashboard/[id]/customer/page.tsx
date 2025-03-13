import CustomerList from "./CustomerList";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { RequiredSubscribe } from "@/components/common";
import { CommonSection } from "@/components/common";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    sortField?: string;
    sortDirection?: string;
  }>;
}

export default async function CustomerPage({
  params,
  searchParams,
}: CustomerPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });
  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as string} />;
  }
  return (
    <CommonSection
      title="顧客一覧"
      backLink="/dashboard"
      backLinkTitle="ダッシュボード"
    >
      <CustomerList id={id} searchParams={resolvedSearchParams} />
    </CommonSection>
  );
}
