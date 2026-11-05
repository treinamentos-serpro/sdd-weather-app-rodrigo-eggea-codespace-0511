function getDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function parseLocalDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return parsedDate.toISOString().slice(0, 10) === date ? parsedDate : null;
}

export function formatDayLabel(date: string, timeZone: string, now = new Date()): string {
  const forecastDate = parseLocalDate(date);
  if (!forecastDate) return 'Data indisponível';

  try {
    const today = getDateInTimeZone(now, timeZone);
    const todayUtc = Date.parse(`${today}T00:00:00Z`);
    const forecastUtc = Date.parse(`${date}T00:00:00Z`);
    const dayOffset = (forecastUtc - todayUtc) / 86_400_000;

    if (dayOffset === 0) return 'Hoje';
    if (dayOffset === 1) return 'Amanhã';

    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(forecastDate);
  } catch {
    return 'Data indisponível';
  }
}

export function getShortDate(date: string): string {
  const parsedDate = parseLocalDate(date);
  if (!parsedDate) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parsedDate);
}
