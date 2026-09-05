const MAP = {
  pending:   { label: 'Queued',  cls: 'badge badge-neutral' },
  running:   { label: 'Working', cls: 'badge badge-running' },
  completed: { label: 'Done',    cls: 'badge badge-done'    },
  failed:    { label: 'Failed',  cls: 'badge badge-failed'  },
};

export default function StatusBadge({ status }) {
  const { label, cls } = MAP[status] || MAP.pending;
  return <span className={cls}>{label}</span>;
}
