import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import MenuList from "./MenuList";
import { CommonSection } from "@/components/common";
import { Id } from "@/convex/_generated/dataModel";
import { RequiredSubscribe } from "@/components/common";
interface MenuPageProps {
  params: Promise<{ id: string }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { id } = await params;
  // サーバーサイドでデータを取得
  const isSubscribed = await fetchQuery(api.subscription.checkSubscription, {
    salonId: id as Id<"salon">,
  });

  if (id && !isSubscribed) {
    return <RequiredSubscribe salonId={id as string} />;
  }

  console.log("isSubscribed", isSubscribed);

  return (
    <CommonSection
      title="メニュー一覧"
      backLink="/dashboard"
      backLinkTitle="ダッシュボード"
      infoBtn={{
        text: "メニューを追加",
        link: `/dashboard/${id}/menu/create`,
      }}
    >
      <MenuList id={id as Id<"salon">} />
    </CommonSection>
  );
}
