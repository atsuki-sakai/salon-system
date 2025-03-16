import StaffLoginForm from "./StaffLoginForm";

export default function StaffLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-2">
        <StaffLoginForm />
      </div>
    </div>
  );
}
