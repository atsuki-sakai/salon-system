import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import EditReservationForm from "./EditReservationForm";
interface EditReservationPageProps {
  params: Promise<{
    id: string;
    reservation_id: string;
  }>;
}

export default async function EditReservationPage({
  params,
}: EditReservationPageProps) {
  // paramsを非同期で解決
  const { reservation_id } = await params;
  const reservation = await fetchQuery(api.reservation.get, {
    reservationId: reservation_id as Id<"reservation">,
  });

  if (!reservation) {
    return <div>予約が見つかりませんでした。</div>;
  }

  return <EditReservationForm reservation={reservation} />;
}
