export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">
        500
        <span className="text-gray-500 text-2xl">Error</span>
      </h1>
      <p className="text-xl font-bold mb-4">サロンが見つかりませんでした</p>
      <span className="text-gray-600 mb-4">
        時間をおいて再度お試しください。
      </span>
    </div>
  );
}
