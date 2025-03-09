import Link from "next/link";
import { useSalonCore } from "@/hooks/useSalonCore";
import Loading from "@/components/common/Loading";
export default function ReservationInfoBanner() {
  const { salonCore, isLoading } = useSalonCore();
  if (isLoading) return <Loading />;

  return (
    <div className="rounded-md bg-green-50 p-2">
      <div className="flex">
        <div className="p-2 w-full">
          <h3 className="text-base font-bold text-green-800">予約受付ページ</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>以下のリンクからサロンの予約ページを確認できます。</p>
            <Link
              href={`${process.env.NEXT_PUBLIC_URL}/reservation/${salonCore?.clerkId}`}
              className="mt-2 w-full md:w-auto"
            >
              {`${process.env.NEXT_PUBLIC_URL}/reservation/${salonCore?.clerkId}`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
