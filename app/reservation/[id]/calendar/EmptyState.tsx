import { ReactElement } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: ReactElement;
  title: string;
  description: string;
  type?: "info" | "warning" | "error";
}
// 空の状態コンポーネント（モバイル最適化）
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  type = "info",
}) => {
  const getBgColor = () => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "warning":
        return "text-amber-800";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning":
        return "text-amber-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <motion.div
      className={`rounded-lg ${getBgColor()} p-4 sm:p-8 text-center ${getTextColor()} shadow-sm border`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`mx-auto mb-4 ${getIconColor()}`}>{icon}</div>
      <p className="text-base font-bold mb-2">{title}</p>
      <p className="text-sm mt-1 max-w-md mx-auto">{description}</p>
    </motion.div>
  );
};
