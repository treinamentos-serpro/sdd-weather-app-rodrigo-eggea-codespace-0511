export type Unit = 'celsius' | 'fahrenheit';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface City {
  id: number;
  name: string;
  country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: string | null;
  temperatureC: number | null;
  weatherCode: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  pressureHpa: number | null;
  status: 'available' | 'unavailable';
}

export interface ForecastDay {
  date: string;
  weatherCode: number | null;
  minC: number | null;
  maxC: number | null;
  precipitationProbability: number | null;
  status: 'complete' | 'unavailable';
}

export interface WeatherData {
  city: City;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export type WeatherServiceErrorCode = 'timeout' | 'network' | 'http' | 'invalidResponse';

export interface WeatherServiceError {
  code: WeatherServiceErrorCode;
  userMessage: string;
}

export interface WeatherViewState {
  status: WeatherStatus;
  query: string;
  cities: City[];
  selectedCity: City | null;
  data: WeatherData | null;
  error: WeatherServiceError | null;
}
