"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { SearchPayload } from "@/lib/types";

export function SearchOverlay({
  open,
  initialQuery = "",
  onClose,
}: {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialQuery);
    setDebounced(initialQuery);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  const result = useQuery({
    queryKey: ["search-overlay", debounced],
    queryFn: async () => (await api.get<SearchPayload>(`/api/search?q=${encodeURIComponent(debounced)}`)).data,
    enabled: open,
  });

  if (!open) return null;

  const opportunities = result.data?.opportunities ?? [];
  const organizations = result.data?.organizations ?? [];
  const suggestions = result.data?.suggestions ?? [];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-[#071510]/45 backdrop-blur-md" aria-label="Close search" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <form
          className="flex items-center gap-2 border-b border-border px-4"
          onSubmit={(event) => {
            event.preventDefault();
            setDebounced(value.trim());
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search opportunity, organization, or keyword"
            aria-label="Search"
            className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </form>
        <div className="max-h-[50vh] overflow-auto p-3">
          {!debounced && (
            <div className="px-2 py-2">
              <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Suggested</p>
              <div className="mt-2 flex flex-col">
                {suggestions.map((item) => (
                  <button key={item} type="button" className="rounded-xl px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => setValue(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          {debounced && result.isLoading && <p className="px-3 py-6 text-sm text-muted-foreground">Searching…</p>}
          {debounced && !result.isLoading && opportunities.length === 0 && organizations.length === 0 && (
            <p className="px-3 py-6 text-sm text-muted-foreground">No matches for “{debounced}”.</p>
          )}
          {opportunities.length > 0 && (
            <div className="space-y-1">
              {opportunities.slice(0, 6).map((item) => (
                <Link key={item.id} href={`/opportunities/${item.slug}`} onClick={onClose} className="block rounded-2xl px-3 py-2 hover:bg-muted">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.organization.name} · {item.location}</p>
                </Link>
              ))}
            </div>
          )}
          {organizations.length > 0 && (
            <div className="mt-3 border-t border-border px-2 pt-3">
              <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Organizations</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {organizations.map((org) => (
                  <Link key={org.id} href={`/organizations/${org.slug}`} onClick={onClose} className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary">
                    {org.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
