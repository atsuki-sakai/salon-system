import StaffLoginForm from "./StaffLoginForm";

export default function StaffLoginPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl font-bold mb-8">スタッフログイン</h1>
        <StaffLoginForm />
      </div>
    </div>
  );
}
