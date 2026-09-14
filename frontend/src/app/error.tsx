"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold text-navy">Something went wrong. Please try again.</h1>
      <button onClick={reset} className="mt-6 rounded-xl bg-primary px-4 py-2 font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
