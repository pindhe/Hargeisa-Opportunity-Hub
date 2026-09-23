export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-2">
      <div className="rounded-[2rem] bg-ink p-8 text-white md:p-12">
        <p className="text-sm tracking-[0.16em] text-emerald-200 uppercase">HOH</p>
        <h2 className="mt-4 font-display text-4xl leading-tight">Opportunities in Hargeisa, gathered in one place.</h2>
        <p className="mt-4 text-white/70">Build a profile once. Search, save, and track everything that matches.</p>
      </div>
      <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
