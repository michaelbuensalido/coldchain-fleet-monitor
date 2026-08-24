interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    online: {
      border: "border-[var(--color-status-online)]/20",
      text: "text-[var(--color-status-online)]",
      bg: "bg-[var(--color-status-online)]/10",
      dot: "bg-[var(--color-status-online)] shadow-[0_0_8px_var(--color-status-online)]",
    },
    degraded: {
      border: "border-[var(--color-status-degraded)]/20",
      text: "text-[var(--color-status-degraded)]",
      bg: "bg-[var(--color-status-degraded)]/10",
      dot: "bg-[var(--color-status-degraded)] shadow-[0_0_8px_var(--color-status-degraded)]",
    },
    offline: {
      border: "border-[var(--color-status-offline)]/20",
      text: "text-[var(--color-status-offline)]",
      bg: "bg-[var(--color-status-offline)]/10",
      dot: "bg-[var(--color-status-offline)] shadow-[0_0_8px_var(--color-status-offline)]",
    },
    pending: {
      border: "border-slate-700/40",
      text: "text-slate-400",
      bg: "bg-slate-800/20",
      dot: "bg-slate-500 shadow-[0_0_8px_rgba(148,163,184,0.5)]",
    },
  };

  const currentStyle = styles[status as keyof typeof styles] || styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border font-mono uppercase ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
      {status}
    </span>
  );
}
