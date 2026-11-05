interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <section
      role="status"
      className="rounded-lg border border-white/10 bg-white/5 px-5 py-6 text-center text-white shadow-glass backdrop-blur-md"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-white/65">{hint}</p>
    </section>
  );
}
