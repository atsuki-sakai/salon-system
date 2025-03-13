import CustomerDetailCard from "./CustomerDetailCard";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { RequiredSubscribe } from "@/components/common";
import { CommonSection } from "@/components/common";

// Next.jsのApp RouterにおけるPagePropsの型定義
type CustomerDetailPageProps = {
  params: {
    id: string;
    customer_id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = params;
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  return (
    <CommonSection
      title="顧客詳細"
      backLink={`/dashboard/${id}/customer`}
      backLinkTitle="顧客一覧"
    >
      <CustomerDetailCard />
    </CommonSection>
  );
}
