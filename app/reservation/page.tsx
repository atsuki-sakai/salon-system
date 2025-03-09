// app/reservation/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
export default function ReserveRedirectPage() {
  const result = useQuery(api.salon.getPaginatedSalons, {
    limit: 10,
  });

  const salonConfigs = useQuery(api.salon_config.getSalonConfig, {
    salonId: "liffId",
  });

  console.log("result", result);
  if (!result) return null;

  console.log("salonConfigs", salonConfigs);
  // ロード中でない場合のフォールバック表示
  return (
    <div className="flex flex-col items-center justify-center h-screen max-w-5xl mx-auto space-y-4">
      {result.salons.map((salon) => (
        <Card key={salon._id}>
          <CardHeader>
            <CardTitle>{salon.email ?? salon.email}</CardTitle>
            <Link href={`/reservation/${salon.clerkId}`}>予約する</Link>
          </CardHeader>
        </Card>
      ))}
      {result.salons.length === 0 && notFound()}
    </div>
  );
}
