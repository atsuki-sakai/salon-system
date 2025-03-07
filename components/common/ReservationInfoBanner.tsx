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
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">予約受付ページ</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>
              以下のリンクをLineの予約ページに設定することで予約受付ページを表示します。
            </p>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_URL}/reserve/${salonCore?.clerkId}`
                );
              }}
            >
              <p>{`${process.env.NEXT_PUBLIC_URL}/reserve/${salonCore?.clerkId}`}</p>
              <span className="text-sm text-gray-500 ml-2">コピー</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
