// app/reserve/page.tsx
"use client";

// import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReserveRedirectPage() {
  const salons = useQuery(api.users.getPaginatedUsers, {
    limit: 10,
  });
  // ロード中でない場合のフォールバック表示
  return (
    <div className="flex flex-col items-center justify-center h-screen max-w-5xl mx-auto space-y-4">
      {salons?.users.map((salon) => (
        <Card key={salon._id}>
          <CardHeader>
            <CardTitle>{salon.email}</CardTitle>
            <Link href={`/reserve/${salon.clerkId}`}>予約する</Link>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
