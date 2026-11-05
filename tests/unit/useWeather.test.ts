import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import * as weatherService from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = mockWeatherData.city;
const anotherCity: City = {
  ...city,
  id: 123,
  name: 'Lisboa',
  latitude: 38.7223,
  longitude: -9.1393,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWeather', () => {
  it('não chama services para busca vazia e permanece idle', async () => {
    const searchSpy = vi.spyOn(weatherService, 'searchCities');
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('   '));

    expect(result.current.status).toBe('idle');
    expect(result.current.query).toBe('');
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('carrega o clima da primeira cidade retornada', async () => {
    vi.spyOn(weatherService, 'searchCities').mockResolvedValue([city, anotherCity]);
    const forecastSpy = vi.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));

    expect(result.current.status).toBe('success');
    expect(result.current.cities).toEqual([city, anotherCity]);
    expect(result.current.selectedCity).toEqual(city);
    expect(result.current.data).toEqual(mockWeatherData);
    expect(forecastSpy).toHaveBeenCalledWith(city);
  });

  it('muda para empty quando geocoding não encontra cidades', async () => {
    vi.spyOn(weatherService, 'searchCities').mockResolvedValue([]);
    const forecastSpy = vi.spyOn(weatherService, 'getWeather');
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('Cidade inexistente'));

    expect(result.current.status).toBe('empty');
    expect(result.current.query).toBe('Cidade inexistente');
    expect(result.current.data).toBeNull();
    expect(forecastSpy).not.toHaveBeenCalled();
  });

  it('retry refaz a última busca de geocoding após erro', async () => {
    vi.spyOn(weatherService, 'searchCities')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([city]);
    vi.spyOn(weatherService, 'getWeather').mockResolvedValue(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');

    await act(async () => result.current.retry());

    expect(result.current.status).toBe('success');
    expect(weatherService.searchCities).toHaveBeenCalledTimes(2);
    expect(weatherService.searchCities).toHaveBeenLastCalledWith('São Paulo');
  });

  it('retry refaz o forecast da cidade selecionada após erro', async () => {
    vi.spyOn(weatherService, 'searchCities').mockResolvedValue([city]);
    const forecastSpy = vi
      .spyOn(weatherService, 'getWeather')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');

    await act(async () => result.current.retry());

    expect(result.current.status).toBe('success');
    expect(forecastSpy).toHaveBeenCalledTimes(2);
    expect(forecastSpy).toHaveBeenLastCalledWith(city);
  });

  it('ignora respostas de busca antigas que terminam depois da mais recente', async () => {
    let resolveOldSearch: (cities: City[]) => void = () => undefined;
    let resolveNewSearch: (cities: City[]) => void = () => undefined;
    vi.spyOn(weatherService, 'searchCities').mockImplementation(
      (name) =>
        new Promise((resolve) => {
          if (name === 'Antiga') resolveOldSearch = resolve;
          else resolveNewSearch = resolve;
        }),
    );
    vi.spyOn(weatherService, 'getWeather').mockImplementation(async (selectedCity) => ({
      ...mockWeatherData,
      city: selectedCity,
    }));
    const { result } = renderHook(() => useWeather());

    let oldSearch: Promise<void> = Promise.resolve();
    let newSearch: Promise<void> = Promise.resolve();
    act(() => {
      oldSearch = result.current.search('Antiga');
      newSearch = result.current.search('Nova');
    });

    await act(async () => {
      resolveNewSearch([anotherCity]);
      await newSearch;
    });
    await act(async () => {
      resolveOldSearch([city]);
      await oldSearch;
    });

    expect(result.current.query).toBe('Nova');
    expect(result.current.cities).toEqual([anotherCity]);
    expect(result.current.selectedCity).toEqual(anotherCity);
    expect(result.current.data?.city).toEqual(anotherCity);
  });
});
