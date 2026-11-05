import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherPresentation } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  timeZone: string;
  unit: Unit;
}

const probabilityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

function formatProbability(value: number | null): string {
  return value === null ? '—' : `${probabilityFormatter.format(value)}%`;
}

export default function ForecastCard({ day, timeZone, unit }: ForecastCardProps) {
  const label = formatDayLabel(day.date, timeZone);
  const weather = getWeatherPresentation(day.weatherCode);

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-4 text-white backdrop-blur-md">
      <h3 className="truncate text-sm font-semibold text-white/80">{label}</h3>
      <div className="mt-4 flex min-h-14 items-center justify-center" aria-hidden="true">
        <span className="text-4xl">{weather.icon}</span>
      </div>
      <p className="sr-only">{weather.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div>
          <dt className="text-xs text-white/55">Máx.</dt>
          <dd className="mt-1 whitespace-nowrap text-lg font-semibold tabular-nums">
            {formatTemperature(day.maxC, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-white/55">Mín.</dt>
          <dd className="mt-1 whitespace-nowrap text-lg font-semibold tabular-nums">
            {formatTemperature(day.minC, unit)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <p className="text-xs text-white/55">Chuva</p>
        <p className="mt-1 text-sm font-medium tabular-nums">
          {formatProbability(day.precipitationProbability)}
        </p>
      </div>
    </article>
  );
}
