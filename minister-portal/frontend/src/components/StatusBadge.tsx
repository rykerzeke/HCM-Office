import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    ESCALATED: "bg-red-100 text-red-800",
    COMPLETED: "bg-green-100 text-green-800",
    RESOLVED: "bg-gray-100 text-gray-800",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colors[status] || "bg-gray-100 text-gray-800")}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colors[priority] || "bg-gray-100 text-gray-800")}>
      {priority}
    </span>
  );
};
