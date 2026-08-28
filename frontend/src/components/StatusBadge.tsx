/* Hallmark · component: StatusBadge · genre: modern-minimal · theme: Cobalt
 * states: default · pulse-online · blink-pending · dim-offline · dim-degraded
 * contrast: pass (46–50)
 */

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Flat pill, tight radius — not rounded-full (too bubbly for industrial register)
  const styles: Record<string, {
    bg: string;
    border: string;
    text: string;
    dot: string;
    dotAnim: string;
  }> = {
    online: {
      bg:      'bg-[var(--color-status-online-dim)]',
      border:  'border-[var(--color-status-online-edge)]',
      text:    'text-[var(--color-status-online)]',
      dot:     'bg-[var(--color-status-online)]',
      dotAnim: 'dot-online',
    },
    degraded: {
      bg:      'bg-[var(--color-status-degraded-dim)]',
      border:  'border-[var(--color-status-degraded-edge)]',
      text:    'text-[var(--color-status-degraded)]',
      dot:     'bg-[var(--color-status-degraded)]',
      dotAnim: '',
    },
    offline: {
      bg:      'bg-[var(--color-status-offline-dim)]',
      border:  'border-[var(--color-status-offline-edge)]',
      text:    'text-[var(--color-status-offline)]',
      dot:     'bg-[var(--color-status-offline)] opacity-70',
      dotAnim: '',
    },
    pending: {
      bg:      'bg-[var(--color-status-pending-dim)]',
      border:  'border-[var(--color-border)]',
      text:    'text-[var(--color-text-muted)]',
      dot:     'bg-[var(--color-status-pending)]',
      dotAnim: 'dot-pending',
    },
  };

  const s = styles[status] ?? styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px text-[9px] font-semibold tracking-widest border font-mono uppercase ${s.bg} ${s.border} ${s.text}`}
      style={{ borderRadius: 'var(--radius-sm)' }}
    >
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${s.dot} ${s.dotAnim}`} />
      {status}
    </span>
  );
}
