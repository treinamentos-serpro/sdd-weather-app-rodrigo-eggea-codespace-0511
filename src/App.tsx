import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { mockWeatherData } from './mocks/weatherData';
import type { Unit, WeatherData, WeatherStatus } from './types/weather';

export default function App() {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [unit, setUnit] = useState<Unit>('celsius');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<WeatherData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSearch(city: string) {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

    setQuery(trimmedCity);
    setData(null);
    setErrorMessage('');
    setStatus('loading');

    try {
      await Promise.resolve();
      const matchesMock =
        trimmedCity.toLocaleLowerCase('pt-BR') ===
        mockWeatherData.city.name.toLocaleLowerCase('pt-BR');

      if (!matchesMock) {
        setStatus('empty');
        return;
      }

      setData(mockWeatherData);
      setStatus('success');
    } catch {
      setErrorMessage('Não foi possível carregar o clima. Tente novamente.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 text-white">
      <header className="border-b border-white/10 bg-night-900/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="#main-content" className="flex items-center gap-2 text-white no-underline">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <span className="text-lg font-bold">WeatherView</span>
          </a>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {status === 'idle' && (
          <EmptyState
            title="Consulte o clima da sua cidade"
            hint="Busque São Paulo para visualizar a previsão de exemplo."
          />
        )}

        {status === 'loading' && <LoadingState />}

        {status === 'empty' && (
          <EmptyState
            title={`Nenhuma cidade encontrada para “${query}”`}
            hint="Tente buscar São Paulo, a cidade disponível neste exemplo local."
          />
        )}

        {status === 'error' && errorMessage && (
          <ErrorState message={errorMessage} onRetry={() => void handleSearch(query)} />
        )}

        {status === 'success' && data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} timeZone={data.timezone} unit={unit} />
          </>
        )}
      </main>

      <footer className="px-4 py-8 text-center text-sm text-white/50">
        Dados de exemplo baseados no formato da Open-Meteo.
      </footer>
    </div>
  );
}
