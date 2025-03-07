"use client";

import Link from "next/link";
import { useSalonCore } from "@/hooks/useSalonCore";
import { XCircleIcon } from "@heroicons/react/24/outline";
import Loading from "@/components/common/Loading";
export default function CancelSubscriptionPage() {
  const { salonCore, isLoading } = useSalonCore();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
          サブスクリプションの購入が
          <br />
          キャンセルされました。
        </h2>
        <p className="mt-8 text-base font-medium text-pretty text-gray-500">
          以下のリンクから再度、サブスクリプションを購入することができます。
          <br />
          <Link
            className="text-blue-500 hover:text-blue-600 underline"
            href={`/dashboard/${salonCore?.salonId}/subscription`}
          >
            サブスクリプションページ
          </Link>
        </p>
        <p className="mt-8 text-base font-medium text-pretty text-gray-500">
          またはサポートへお問い合わせください。
          <a className="underline" href="mailto:atk721@icloud.com">
            atk721@icloud.com
          </a>
        </p>
      </div>
    </div>
  );
}
