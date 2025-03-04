"use client";

import { Profile } from "./line-profile";
import { useSearchParams } from "next/navigation";
export default function CalenderPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("salonId");
  if (!id) {
    return <div>No salonId</div>;
  }
  return <Profile id={id} />;
}
