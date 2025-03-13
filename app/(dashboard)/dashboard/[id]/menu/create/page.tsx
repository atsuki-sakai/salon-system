// /app/(dashboard)/dashboard/[id]/menu/create/page.tsx

import MenuCreateForm from "./MenuCreateForm";
import { CommonSection, RequiredSubscribe } from "@/components/common";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface MenuCreatePageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: MenuCreatePageProps) {
  const { id } = await params;

  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (!isSubscribed) {
    return <RequiredSubscribe salonId={id} />;
  }

  return (
    <CommonSection
      title="新しいメニューを追加"
      backLink={`/dashboard/${id}/menu`}
      backLinkTitle="メニュー一覧に戻る"
    >
      <MenuCreateForm id={id} />
    </CommonSection>
  );
}
