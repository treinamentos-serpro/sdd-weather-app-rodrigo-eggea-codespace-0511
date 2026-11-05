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

export function formatDayLabel(date: string, timeZone: string, now = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Data indisponível';

  try {
    const [year, month, day] = date.split('-').map(Number);
    const forecastDate = new Date(Date.UTC(year, month - 1, day));
    if (forecastDate.toISOString().slice(0, 10) !== date) return 'Data indisponível';

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
