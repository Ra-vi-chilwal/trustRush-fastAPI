const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (amount: number): string => inr.format(amount);

const dateTime = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateTime.format(d);
};

export interface DateParts {
  day: string;
  month: string;
  weekday: string;
  time: string;
}

export function dateParts(iso: string): DateParts {
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString('en-IN', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleString('en-IN', { weekday: 'short' }),
    time: d.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' }),
  };
}

/** 125 -> "02:05" */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Stable small hash, used to pick a poster colour per event. */
export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}
