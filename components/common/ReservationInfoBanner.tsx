import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useSalonCore } from "@/hooks/useSalonCore";
import Loading from "@/components/common/Loading";
export default function ReservationInfoBanner() {
  const { salonCore, isLoading } = useSalonCore();
  if (isLoading) return <Loading />;

  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="shrink-0">
          <CheckCircleIcon
            aria-hidden="true"
            className="size-5 text-green-400"
          />
        </div>
        <div className="p-3 w-full">
          <h3 className="text-base font-bold text-green-800">予約受付ページ</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>以下のリンクからサロンの予約ページを確認できます。</p>
            <Button
              className="mt-2 w-full md:w-auto"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_URL}/reserve/${salonCore?.clerkId}`
                );
              }}
            >
              <div className="flex items-center w-full overflow-hidden">
                <p className="text-sm truncate">{`${process.env.NEXT_PUBLIC_URL}/reserve/${salonCore?.clerkId}`}</p>
                <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">
                  コピー
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
