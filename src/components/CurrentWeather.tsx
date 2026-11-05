import { formatTemperature } from '../lib/temperature';
import { getWeatherPresentation } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const metricFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number | null, unit: string): string {
  if (value === null) return '—';

  const formattedValue = metricFormatter.format(value);
  return unit === '%' ? `${formattedValue}${unit}` : `${formattedValue} ${unit}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const weather = getWeatherPresentation(current.weatherCode);
  const temperature = formatTemperature(current.temperatureC, unit);
  const temperatureUnit = unit === 'celsius' ? '°C' : '°F';
  const location = [city.region, city.country].filter(Boolean).join(', ');

  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-labelledby="current-weather-title"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">Clima atual</p>
          <h2 id="current-weather-title" className="mt-1 text-2xl font-semibold">
            {city.name}
          </h2>
          {location && <p className="mt-1 text-sm text-white/60">{location}</p>}
        </div>

        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="text-5xl sm:text-6xl">
            {weather.icon}
          </span>
          <div>
            <p className="text-6xl font-semibold leading-none tabular-nums sm:text-7xl">
              {temperature}
              {current.temperatureC !== null && (
                <span className="ml-1 align-top text-2xl font-medium text-white/70 sm:text-3xl">
                  {temperatureUnit}
                </span>
              )}
            </p>
            <p className="mt-2 text-base text-white/80">{weather.description}</p>
          </div>
        </div>
      </div>

      {current.status === 'unavailable' && (
        <p role="status" className="mt-5 text-sm text-white/60">
          Dados principais do clima atual indisponíveis.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <dt className="text-sm text-white/60">{metric.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
