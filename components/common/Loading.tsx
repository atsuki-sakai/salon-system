export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-20vh)] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-lg  text-gray-600 uppercase tracking-widest animate-gradientText">
          Loading...
        </h2>
        <div className="flex items-end space-x-1 gap-x-1.5">
          <div className="h-4 w-1 bg-indigo-900 animate-wave animation-delay-0" />
          <div className="h-6 w-1 bg-indigo-800 animate-wave animation-delay-200" />
          <div className="h-8 w-1 bg-indigo-700 animate-wave animation-delay-400" />
          <div className="h-6 w-1 bg-indigo-600 animate-wave animation-delay-600" />
          <div className="h-4 w-1 bg-indigo-500 animate-wave animation-delay-800" />
        </div>
      </div>
    </div>
  );
}
