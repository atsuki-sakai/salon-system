export default async function ReservePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>ReservePage {id}</div>;
}
