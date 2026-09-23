"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { OpportunityCard } from "@/components/opportunity-card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { SearchPayload } from "@/lib/types";

function SearchScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 300);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next !== initial) router.replace(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }, [debounced, initial, router]);

  const result = useQuery({
    queryKey: ["search", initial],
    queryFn: async () => (await api.get<SearchPayload>(`/api/search?q=${encodeURIComponent(initial)}`)).data,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl">Search</h1>
      <Input className="mt-4" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Opportunity, organization, skill, or location" aria-label="Search" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm text-muted-foreground">{result.data ? `${result.data.total} results` : "Searching…"}</p>
          <div className="mt-4 grid gap-4">
            {(result.data?.opportunities ?? []).map((item) => <OpportunityCard key={item.id} opportunity={item} layout="list" />)}
          </div>
          {result.data?.organizations && result.data.organizations.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold">Organizations</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.data.organizations.map((org) => (
                  <Link key={org.id} href={`/organizations/${org.slug}`} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{org.name}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-4">
            <p className="font-semibold">Related categories</p>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {(result.data?.related_categories ?? []).map((item) => (
                <Link key={item.id} href={`/opportunities?category=${item.slug}`} className="text-primary">{item.name}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-4">
            <p className="font-semibold">Suggested searches</p>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {(result.data?.suggestions ?? []).map((item) => (
                <button key={item} type="button" className="text-left text-primary" onClick={() => setValue(item)}>{item}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchScreen /></Suspense>;
}
