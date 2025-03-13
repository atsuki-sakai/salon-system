// /app/(dashboard)/dashboard/[id]/menu/edit/[menu_id]/page.tsx
import { CommonSection } from "@/components/common";
import MenuEditForm from "./MenuEditForm";

interface MenuEditPageProps {
  params: Promise<{ id: string; menu_id: string }>;
}

export default async function MenuEditPage({ params }: MenuEditPageProps) {
  const { id, menu_id } = await params;

  return (
    <CommonSection
      title="メニューを編集"
      backLink={`/dashboard/${id}/menu`}
      backLinkTitle="メニュー一覧に戻る"
    >
      <MenuEditForm id={id} menu_id={menu_id} />
    </CommonSection>
  );
}
