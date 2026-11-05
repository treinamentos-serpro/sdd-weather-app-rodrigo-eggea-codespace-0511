import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function convertTemperature(valueC: number, unit: Unit): number {
  return unit === 'fahrenheit' ? toFahrenheit(valueC) : valueC;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function formatTemperature(valueC: number | null, unit: Unit): string {
  if (valueC === null) return '—';

  const value = Math.round(convertTemperature(valueC, unit));
  return `${value} ${unitLabel(unit)}`;
}
