import { describe, expect, it } from 'vitest';
import { getWeatherPresentation } from '../../src/lib/weatherCodes';

describe('getWeatherPresentation', () => {
  it.each([
    [0, 'Céu limpo', '☀️'],
    [3, 'Encoberto', '☁️'],
    [61, 'Chuva fraca', '🌧️'],
  ])('mapeia o código WMO %i para descrição e ícone', (code, description, icon) => {
    expect(getWeatherPresentation(code)).toEqual({ description, icon });
  });

  it('retorna fallback para código desconhecido', () => {
    expect(getWeatherPresentation(999)).toEqual({
      description: 'Condição desconhecida',
      icon: '？',
    });
  });

  it('retorna estado indisponível quando não há código', () => {
    expect(getWeatherPresentation(null)).toEqual({
      description: 'Condição indisponível',
      icon: '—',
    });
  });
});
