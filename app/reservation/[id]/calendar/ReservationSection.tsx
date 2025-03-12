import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ReactNode, ReactElement } from "react";
interface SectionProps {
  badge: string;
  title: string;
  children: ReactNode;
  isComplete?: boolean;
  isDisabled?: boolean;
  icon?: ReactElement;
  error?: string;
  isOptional?: boolean;
  isActive?: boolean;
}

export const ReservationSection: React.FC<SectionProps> = ({
  badge,
  title,
  children,
  isComplete = false,
  isDisabled = false,
  icon,
  error,
  isActive = false,
}: SectionProps) => {
  // セクションのスタイル決定ロジック
  const getSectionStyle = () => {
    if (isDisabled)
      return "space-y-4 p-4 sm:p-6 rounded-lg border border-gray-200 bg-gray-50/50 opacity-75 transition-all duration-200";
    if (isComplete)
      return "space-y-4 p-4 sm:p-6 rounded-lg border border-green-200 bg-green-50/20 transition-all duration-200";
    if (isActive)
      return "space-y-4 p-4 sm:p-6 rounded-lg border-2 border-amber-200 bg-amber-50/30 shadow-sm transition-all duration-200";
    return "space-y-4 p-4 sm:p-6 rounded-lg border bg-white transition-all duration-200 ";
  };

  const getBadgeStyle = () => {
    if (isDisabled)
      return "bg-gray-100 text-gray-400 border-gray-200 py-1 px-2 text-base font-semibold opacity-60";
    if (isComplete)
      return "bg-green-100 text-green-700 border-green-300 py-1 px-2 text-base font-semibold";
    if (isActive)
      return "bg-amber-100 text-amber-700 border-amber-300 py-1 px-3 text-base font-semibold";
    return "bg-gray-100 text-gray-600 border-gray-200 py-1 px-3 text-base font-semibold";
  };

  const getTitleStyle = () => {
    if (isDisabled) return "text-base font-medium text-gray-400 px-3";
    if (isComplete) return "text-base font-medium text-green-700 px-3";
    if (isActive) return "text-base font-medium text-amber-700 px-3";
    return "text-base font-medium text-gray-700 px-3";
  };

  return (
    <motion.div
      className={getSectionStyle()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 justify-start w-fit">
        <Badge variant="outline" className={getBadgeStyle()}>
          {badge}
        </Badge>
        <span className={getTitleStyle()}>{title}</span>

        {icon && (
          <span className={isActive ? "text-slate-500" : "text-gray-400"}>
            {icon}
          </span>
        )}

        {isComplete && (
          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-1 bg-red-50 p-2 rounded-md border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">{children}</div>
    </motion.div>
  );
};
