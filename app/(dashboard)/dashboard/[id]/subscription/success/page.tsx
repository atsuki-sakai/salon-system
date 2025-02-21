"use client";

import Link from "next/link";
import { useUserDetails } from "@/lib/atoms/userAtom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Loading from "@/components/common/Loading";
export default function SuccessSubscriptionPage() {
  const { userDetails, isLoading } = useUserDetails();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
          サブスクリプションの購入が
          <br />
          完了しました。
        </h2>
        <p className="mt-8 text-base font-medium text-pretty text-gray-500">
          契約の更新は、
          <Link
            className="text-blue-500 hover:text-blue-600 underline"
            href={`/dashboard/${userDetails?.clerkId}/subscription`}
          >
            サブスクリプションページ
          </Link>
          から行えます。
        </p>
      </div>
    </div>
  );
}
