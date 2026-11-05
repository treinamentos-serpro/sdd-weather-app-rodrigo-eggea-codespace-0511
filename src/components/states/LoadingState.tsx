export default function LoadingState() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80 shadow-glass backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-white/25 border-t-accent-400 motion-reduce:animate-none"
      />
      <span>Carregando previsão do tempo...</span>
    </div>
  );
}
