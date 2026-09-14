export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold text-navy">Page not found</h1>
      <p className="mt-3 text-slate-600">The page you are looking for does not exist.</p>
      <a href="/" className="mt-6 inline-block font-semibold text-primary">Back home</a>
    </div>
  );
}
