import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it('mantém o valor em Celsius quando a unidade é celsius', () => {
    expect(convertTemperature(18, 'celsius')).toBe(18);
  });

  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %i °C para %i °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });
});

describe('formatTemperature', () => {
  it('arredonda e inclui o símbolo de Celsius', () => {
    expect(formatTemperature(18.6, 'celsius')).toBe('19 °C');
  });

  it('converte, arredonda e inclui o símbolo de Fahrenheit', () => {
    expect(formatTemperature(18.4, 'fahrenheit')).toBe('65 °F');
  });

  it('representa temperatura ausente sem inventar um valor', () => {
    expect(formatTemperature(null, 'celsius')).toBe('—');
  });
});

describe('unitLabel', () => {
  it('retorna o símbolo da unidade selecionada', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});
