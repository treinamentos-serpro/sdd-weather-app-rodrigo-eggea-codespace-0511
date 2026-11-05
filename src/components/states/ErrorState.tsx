interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-rose-300/20 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md"
    >
      <p className="text-sm text-rose-100">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      >
        Tentar novamente
      </button>
    </section>
  );
}
