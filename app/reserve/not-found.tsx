import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold mb-4">サロンが見つかりませんでした</h2>
      <p className="text-gray-600 mb-4">URLが正しいかご確認ください</p>
      <Link href="/reserve">
        <Button className="bg-green-600 text-white font-bold">
          予約トップに戻る
        </Button>
      </Link>
    </div>
  );
}
