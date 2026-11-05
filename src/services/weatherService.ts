import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
  WeatherServiceErrorCode,
  WeatherServiceError as WeatherServiceErrorShape,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export class WeatherServiceError extends Error implements WeatherServiceErrorShape {
  readonly code: WeatherServiceErrorCode;
  readonly userMessage: string;

  constructor(code: WeatherServiceErrorCode, userMessage: string) {
    super(userMessage);
    this.name = 'WeatherServiceError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    (value.country === undefined || typeof value.country === 'string') &&
    (value.admin1 === undefined || typeof value.admin1 === 'string')
  );
}

function toCity(result: GeocodingResult): City {
  return {
    id: result.id,
    name: result.name,
    country: result.country ?? null,
    region: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw new WeatherServiceError('timeout', 'A requisição demorou demais.');
    }
    throw new WeatherServiceError('network', 'Falha de rede.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError('http', 'Não foi possível buscar a cidade. Tente novamente.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('invalidResponse', 'A resposta de busca é inválida.');
  }

  if (!isRecord(payload)) {
    throw new WeatherServiceError('invalidResponse', 'A resposta de busca é inválida.');
  }

  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results) || !payload.results.every(isGeocodingResult)) {
    throw new WeatherServiceError('invalidResponse', 'A resposta de busca é inválida.');
  }

  return payload.results.map(toCity);
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isLocalDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function mapForecastDay(daily: Record<string, unknown>, index: number, date: string): ForecastDay {
  const weatherCodes = Array.isArray(daily.weather_code) ? daily.weather_code : [];
  const minimums = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
  const maximums = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const precipitationProbabilities = Array.isArray(daily.precipitation_probability_max)
    ? daily.precipitation_probability_max
    : [];

  const weatherCode = nullableNumber(weatherCodes[index]);
  const minC = nullableNumber(minimums[index]);
  const maxC = nullableNumber(maximums[index]);

  return {
    date,
    weatherCode,
    minC,
    maxC,
    precipitationProbability: nullableNumber(precipitationProbabilities[index]),
    status: weatherCode !== null && minC !== null && maxC !== null ? 'complete' : 'unavailable',
  };
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    forecast_days: '5',
    timezone: 'auto',
  });

  const response = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new WeatherServiceError('http', 'Não foi possível carregar o clima. Tente novamente.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('invalidResponse', 'A resposta de previsão é inválida.');
  }

  if (!isRecord(payload) || !isRecord(payload.current) || !isRecord(payload.daily)) {
    throw new WeatherServiceError(
      'invalidResponse',
      'A resposta de previsão está incompleta. Tente novamente.',
    );
  }

  if (typeof payload.timezone !== 'string' || payload.timezone.length === 0) {
    throw new WeatherServiceError('invalidResponse', 'A resposta não contém o fuso horário.');
  }

  const currentResponse = payload.current;
  const dailyResponse = payload.daily;
  const dailyDates = dailyResponse.time;
  if (!Array.isArray(dailyDates) || dailyDates.length !== 5 || !dailyDates.every(isLocalDate)) {
    throw new WeatherServiceError(
      'invalidResponse',
      'A resposta não contém cinco datas válidas de previsão.',
    );
  }

  const temperatureC = nullableNumber(currentResponse.temperature_2m);
  const weatherCode = nullableNumber(currentResponse.weather_code);
  const current: CurrentWeather = {
    time: typeof currentResponse.time === 'string' ? currentResponse.time : null,
    temperatureC,
    weatherCode,
    humidityPercent: nullableNumber(currentResponse.relative_humidity_2m),
    windSpeedKmh: nullableNumber(currentResponse.wind_speed_10m),
    precipitationMm: nullableNumber(currentResponse.precipitation),
    pressureHpa: nullableNumber(currentResponse.surface_pressure),
    status: temperatureC !== null && weatherCode !== null ? 'available' : 'unavailable',
  };

  return {
    city,
    timezone: payload.timezone,
    current,
    forecast: dailyDates.map((date, index) => mapForecastDay(dailyResponse, index, date)),
  };
}
