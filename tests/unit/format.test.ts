import { describe, expect, it } from 'vitest';
import { formatDayLabel, getShortDate } from '../../src/lib/format';

const timeZone = 'America/Sao_Paulo';
const referenceNow = new Date('2026-11-05T16:00:00.000Z');

describe('formatDayLabel', () => {
  it('rotula a posição 0 como Hoje e a posição 1 como Amanhã', () => {
    expect(formatDayLabel('2026-11-05', timeZone, referenceNow)).toBe('Hoje');
    expect(formatDayLabel('2026-11-06', timeZone, referenceNow)).toBe('Amanhã');
  });

  it('usa o dia da semana para as posições seguintes', () => {
    expect(formatDayLabel('2026-11-07', timeZone, referenceNow)).toBe('sábado');
    expect(formatDayLabel('2026-11-08', timeZone, referenceNow)).toBe('domingo');
    expect(formatDayLabel('2026-11-09', timeZone, referenceNow)).toBe('segunda-feira');
  });

  it('retorna fallback para uma data ISO inválida', () => {
    expect(formatDayLabel('2026-02-30', timeZone, referenceNow)).toBe('Data indisponível');
  });
});

describe('getShortDate', () => {
  it('formata a data ISO em dd/MM', () => {
    expect(getShortDate('2026-11-05')).toBe('05/11');
  });

  it('retorna fallback para data inválida', () => {
    expect(getShortDate('data-invalida')).toBe('—');
  });
});
