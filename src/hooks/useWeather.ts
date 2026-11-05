import { useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type {
  City,
  WeatherData,
  WeatherServiceError as WeatherServiceErrorType,
  WeatherViewState,
} from '../types/weather';

interface SearchOperation {
  type: 'search';
  name: string;
}

interface ForecastOperation {
  type: 'forecast';
  city: City;
}

type LastOperation = SearchOperation | ForecastOperation;

interface UseWeatherResult extends WeatherViewState {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

function toWeatherServiceError(error: unknown): WeatherServiceErrorType {
  if (error instanceof WeatherServiceError) return error;

  return new WeatherServiceError('network', 'Falha de rede.');
}

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherViewState>({
    status: 'idle',
    query: '',
    cities: [],
    selectedCity: null,
    data: null,
    error: null,
  });
  const latestRequestId = useRef(0);
  const lastOperation = useRef<LastOperation | null>(null);

  async function loadForecast(
    city: City,
    query: string,
    cities: City[],
    requestId: number,
  ): Promise<void> {
    try {
      const data: WeatherData = await getWeather(city);
      if (requestId !== latestRequestId.current) return;

      setState({
        status: 'success',
        query,
        cities,
        selectedCity: city,
        data,
        error: null,
      });
    } catch (error) {
      if (requestId !== latestRequestId.current) return;

      setState((current) => ({
        ...current,
        status: 'error',
        query,
        cities,
        selectedCity: city,
        data: null,
        error: toWeatherServiceError(error),
      }));
    }
  }

  async function search(name: string): Promise<void> {
    const query = name.trim();
    const requestId = ++latestRequestId.current;

    if (!query) {
      lastOperation.current = null;
      setState({
        status: 'idle',
        query: '',
        cities: [],
        selectedCity: null,
        data: null,
        error: null,
      });
      return;
    }

    lastOperation.current = { type: 'search', name: query };
    setState({
      status: 'loading',
      query,
      cities: [],
      selectedCity: null,
      data: null,
      error: null,
    });

    let cities: City[];
    try {
      cities = await searchCities(query);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;

      setState({
        status: 'error',
        query,
        cities: [],
        selectedCity: null,
        data: null,
        error: toWeatherServiceError(error),
      });
      return;
    }

    if (requestId !== latestRequestId.current) return;
    if (cities.length === 0) {
      setState({
        status: 'empty',
        query,
        cities: [],
        selectedCity: null,
        data: null,
        error: null,
      });
      return;
    }

    const firstCity = cities[0];
    if (!firstCity) return;

    lastOperation.current = { type: 'forecast', city: firstCity };
    setState({
      status: 'loading',
      query,
      cities,
      selectedCity: firstCity,
      data: null,
      error: null,
    });
    await loadForecast(firstCity, query, cities, requestId);
  }

  async function selectCity(city: City): Promise<void> {
    const requestId = ++latestRequestId.current;
    const query = state.query;
    const cities = state.cities;
    lastOperation.current = { type: 'forecast', city };

    setState({
      status: 'loading',
      query,
      cities,
      selectedCity: city,
      data: null,
      error: null,
    });
    await loadForecast(city, query, cities, requestId);
  }

  async function retry(): Promise<void> {
    const operation = lastOperation.current;
    if (!operation) return;

    if (operation.type === 'search') {
      await search(operation.name);
      return;
    }

    await selectCity(operation.city);
  }

  return { ...state, search, selectCity, retry };
}
