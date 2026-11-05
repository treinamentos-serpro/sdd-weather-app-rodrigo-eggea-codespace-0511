import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  timeZone: string;
  unit: Unit;
}

export default function ForecastList({ forecast, timeZone, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-heading">
      <h2 id="forecast-heading" className="mb-4 text-xl font-semibold text-white">
        Próximos 5 dias
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {forecast.map((day) => (
          <ForecastCard key={day.date} day={day} timeZone={timeZone} unit={unit} />
        ))}
      </div>
    </section>
  );
}
