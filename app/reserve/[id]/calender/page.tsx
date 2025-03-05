"use client";

import { Profile } from "./line-profile";
import { useParams } from "next/navigation";

export default function CalenderPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) {
    return <div>No salonId</div>;
  }
  return <Profile id={id} />;
}
