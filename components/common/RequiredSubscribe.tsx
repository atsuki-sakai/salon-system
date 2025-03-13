"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LockIcon, ArrowRightIcon, CrownIcon } from "lucide-react";

export default function RequiredSubscribe({ salonId }: { salonId: string }) {
  const router = useRouter();

  return (
    <div className="min-h-[500px] flex items-center justify-center ">
      <Card className="w-full max-w-md shadow-lg border-blue-200 ">
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <CrownIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-center text-slate-800 text-2xl font-bold tracking-wider">
            プレミアムコンテンツ
          </CardTitle>
          <CardDescription className="text-center text-slate-600 text-sm">
            このページを利用するにはサブスクリプション契約が必要です。プレミアム機能にアクセスして、すべての特典をお楽しみください。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-2">
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/30 text-red-700 rounded-lg p-3">
            <LockIcon className="h-5 w-5" />
            <p className="text-sm">サブスクリプションメンバーだけの限定機能</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            className="w-full px-6 mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push(`${salonId}/subscription`)}
          >
            サブスクリプション契約へ
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full text-muted-foreground"
            onClick={() => router.back()}
          >
            戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
