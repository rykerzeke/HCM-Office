interface BadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  ESCALATED: { label: 'Escalated', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  RESOLVED: { label: 'Resolved', bg: 'bg-teal-500/10', text: 'text-teal-400', dot: 'bg-teal-400' },
  ARCHIVED: { label: 'Archived', bg: 'bg-surface-500/10', text: 'text-surface-400', dot: 'bg-surface-400' },
};

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  LOW: { label: 'Low', bg: 'bg-surface-500/10', text: 'text-surface-400' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  HIGH: { label: 'High', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  URGENT: { label: 'Urgent', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

export const StatusBadge = ({ status }: BadgeProps) => {
  const config = statusConfig[status] || { label: status, bg: 'bg-surface-500/10', text: 'text-surface-400', dot: 'bg-surface-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
  const config = priorityConfig[priority] || { label: priority, bg: 'bg-surface-500/10', text: 'text-surface-400' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
