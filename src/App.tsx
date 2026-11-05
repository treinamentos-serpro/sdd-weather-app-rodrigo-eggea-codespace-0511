import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const { status, data, error, query, search, retry } = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');

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
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {status === 'idle' && (
          <EmptyState
            title="Consulte o clima da sua cidade"
            hint="Busque uma cidade para consultar as condições e a previsão do tempo."
          />
        )}

        {status === 'loading' && <LoadingState />}

        {status === 'empty' && (
          <EmptyState
            title={`Nenhuma cidade encontrada para “${query}”`}
            hint="Verifique a grafia ou tente buscar outra cidade."
          />
        )}

        {status === 'error' && (
          <ErrorState
            message={error?.userMessage ?? 'Não foi possível carregar o clima. Tente novamente.'}
            onRetry={() => void retry()}
          />
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
