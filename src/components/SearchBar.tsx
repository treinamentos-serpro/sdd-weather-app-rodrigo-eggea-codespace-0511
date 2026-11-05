import { type FormEvent, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled: boolean;
}

export default function SearchBar({ onSearch, disabled }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const city = query.trim();
    if (!city) {
      setValidationMessage('Informe o nome de uma cidade.');
      inputRef.current?.focus();
      return;
    }

    setValidationMessage('');
    onSearch(city);
  }

  function handleChange(value: string) {
    setQuery(value);
    if (validationMessage) setValidationMessage('');
  }

  return (
    <div className="w-full">
      <form
        role="search"
        aria-label="Busca de cidades"
        onSubmit={handleSubmit}
        className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5 shadow-glass backdrop-blur-md"
      >
        <label htmlFor="city-search" className="sr-only">
          Buscar cidade
        </label>
        <input
          ref={inputRef}
          id="city-search"
          type="search"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Digite o nome da cidade"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={validationMessage ? true : undefined}
          aria-describedby={validationMessage ? 'city-search-error' : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="shrink-0 rounded-md bg-accent-400 px-4 py-2 text-sm font-semibold text-night-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </form>
      {validationMessage && (
        <p id="city-search-error" role="alert" className="mt-2 text-sm text-rose-300">
          {validationMessage}
        </p>
      )}
    </div>
  );
}
