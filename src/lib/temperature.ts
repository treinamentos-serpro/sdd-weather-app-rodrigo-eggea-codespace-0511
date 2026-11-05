import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(valueC: number | null, unit: Unit): string {
  if (valueC === null) return '—';

  const value = unit === 'fahrenheit' ? toFahrenheit(valueC) : valueC;
  return String(Math.round(value));
}
