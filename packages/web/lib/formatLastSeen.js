export function formatLastSeen(value, now = Date.now()) {
  if (!value) return 'Last seen unavailable';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Last seen unavailable';

  const elapsedMinutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (elapsedMinutes < 1) return 'Last seen just now';
  if (elapsedMinutes < 60) return `Last seen ${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Last seen ${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) return 'Last seen yesterday';
  if (elapsedDays < 7) return `Last seen ${elapsedDays}d ago`;

  return `Last seen ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(timestamp)}`;
}
