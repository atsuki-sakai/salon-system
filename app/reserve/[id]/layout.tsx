export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
