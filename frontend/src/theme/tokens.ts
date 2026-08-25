export const surface = {
  panel:
    "bg-[var(--color-surface-panel)] border border-[var(--color-border-quiet)]",
  card: "bg-slate-900/50 border border-slate-800",
  cardHover: "hover:bg-slate-800/60 hover:border-slate-700",
  well: "bg-slate-950/50 border border-slate-800/70",
  divider: "border-slate-800/60",
};

export const type = {
  eyebrow:
    "font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500",
  label: "font-sans text-xs text-slate-400",
  heading:
    "font-sans text-sm font-semibold text-[var(--color-text-main)] tracking-tight",
  data: "font-mono",
};

export const icon = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

export const severityColor = {
  mild: {
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
  },
  severe: {
    text: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/25",
  },
} as const;
