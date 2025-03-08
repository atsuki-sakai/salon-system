import Calendar from "./Calendar";
import { useSalonCore } from "@/hooks/useSalonCore";
export default function CalendarPage() {
  const { isSubscribed } = useSalonCore();
  if (!isSubscribed) {
    return (
      <div className="text-center text-sm text-gray-500 min-h-[500px] flex items-center justify-center">
        サブスクリプション契約が必要です。
      </div>
    );
  }
  return <Calendar />;
}
