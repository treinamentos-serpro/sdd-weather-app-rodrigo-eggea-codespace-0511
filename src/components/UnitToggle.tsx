import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const celsiusButtonRef = useRef<HTMLButtonElement>(null);
  const fahrenheitButtonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentUnit: Unit) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const nextUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    onChange(nextUnit);

    if (nextUnit === 'celsius') {
      celsiusButtonRef.current?.focus();
    } else {
      fahrenheitButtonRef.current?.focus();
    }
  }

  const buttonClassName =
    'min-w-11 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900';

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-md shadow-glass"
    >
      <button
        ref={celsiusButtonRef}
        type="button"
        aria-pressed={unit === 'celsius'}
        tabIndex={unit === 'celsius' ? 0 : -1}
        onClick={() => onChange('celsius')}
        onKeyDown={(event) => handleKeyDown(event, 'celsius')}
        className={`${buttonClassName} ${
          unit === 'celsius'
            ? 'bg-accent-500 text-white shadow-glass'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        °C
      </button>
      <button
        ref={fahrenheitButtonRef}
        type="button"
        aria-pressed={unit === 'fahrenheit'}
        tabIndex={unit === 'fahrenheit' ? 0 : -1}
        onClick={() => onChange('fahrenheit')}
        onKeyDown={(event) => handleKeyDown(event, 'fahrenheit')}
        className={`${buttonClassName} ${
          unit === 'fahrenheit'
            ? 'bg-accent-500 text-white shadow-glass'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        °F
      </button>
    </div>
  );
}
