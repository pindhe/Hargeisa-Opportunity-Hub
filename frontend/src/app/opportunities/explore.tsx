"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { OpportunityCard } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { EDUCATION_LEVELS, LOCATION_OPTIONS, OPPORTUNITY_TYPES, SKILL_OPTIONS, type Category, type Organization, type PageResult } from "@/lib/types";
import { cn, typeLabel } from "@/lib/utils";

const deadlineLabels: Record<string, string> = {
  week: "This week",
  soon: "Next 14 days",
  month: "This month",
};

export function ExplorePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const query = params.toString();
  const result = useQuery({
    queryKey: ["opportunities", query],
    queryFn: async () => (await api.get<PageResult>(`/api/opportunities?${query || "page=1"}`)).data,
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get<Category[]>("/api/categories")).data });
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: async () => (await api.get<Organization[]>("/api/organizations")).data });

 const queryText = params.get("q") ?? "";
  useEffect(() => {
    setDraft(queryText);
  }, [queryText]);

  function update(next: Record<string, string>, resetPage = true) {
    const nextParams = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) nextParams.delete(key);
      else nextParams.set(key, value);
    });
    if (resetPage) nextParams.delete("page");
    const search = nextParams.toString();
    router.push(search ? `/opportunities?${search}` : "/opportunities");
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    update({ q: draft.trim() });
  }

  const page = Number(params.get("page") ?? "1");
  const pageSize = result.data?.page_size ?? 12;
  const total = result.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const activeType = params.get("type") ?? "";
  const chips = activeChips(params, categories.data ?? [], organizations.data ?? []);

  return (
    <div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Catalogue</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Explore opportunities</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Scholarships, jobs, internships, courses, and competitions open to students and graduates in Hargeisa.
          </p>
          <form onSubmit={onSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search by title, skill, or organization"
                aria-label="Search opportunities"
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <TypeChip active={!activeType} onClick={() => update({ type: "" })}>
              All
            </TypeChip>
            {OPPORTUNITY_TYPES.map((type) => (
              <TypeChip key={type} active={activeType === type} onClick={() => update({ type: activeType === type ? "" : type })}>
                {typeLabel(type)}
              </TypeChip>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className={cn("lg:sticky lg:top-24 lg:self-start", filtersOpen ? "block" : "hidden lg:block")}>
          <div className="space-y-4 rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Filters</p>
              {chips.length > 0 && (
                <button type="button" className="text-xs font-semibold text-primary" onClick={() => { setDraft(""); router.push("/opportunities"); }}>
                  Clear all
                </button>
              )}
            </div>
            <Filter label="Category">
              <Select value={params.get("category") ?? ""} onChange={(event) => update({ category: event.target.value })}>
                <option value="">All categories</option>
                {(categories.data ?? []).map((item) => (
                  <option key={item.id} value={item.slug}>{item.name}</option>
                ))}
              </Select>
            </Filter>
            <Filter label="Location">
              <Select value={params.get("location") ?? ""} onChange={(event) => update({ location: event.target.value })}>
                <option value="">Anywhere</option>
                {LOCATION_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Filter>
            <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
              <input type="checkbox" checked={params.get("remote") === "true"} onChange={(event) => update({ remote: event.target.checked ? "true" : "" })} />
              Remote only
            </label>
            <Filter label="Deadline">
              <Select value={params.get("deadline") ?? ""} onChange={(event) => update({ deadline: event.target.value })}>
                <option value="">Any open deadline</option>
                <option value="week">This week</option>
                <option value="soon">Next 14 days</option>
                <option value="month">This month</option>
              </Select>
            </Filter>
            <Filter label="Education level">
              <Select value={params.get("education_level") ?? ""} onChange={(event) => update({ education_level: event.target.value })}>
                <option value="">Any level</option>
                {EDUCATION_LEVELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Filter>
            <Filter label="Organization">
              <Select value={params.get("organization") ?? ""} onChange={(event) => update({ organization: event.target.value })}>
                <option value="">All organizations</option>
                {(organizations.data ?? []).map((item) => (
                  <option key={item.id} value={item.slug}>{item.name}</option>
                ))}
              </Select>
            </Filter>
            <Filter label="Skills">
              <Select value={params.get("skills") ?? ""} onChange={(event) => update({ skills: event.target.value })}>
                <option value="">Any skill</option>
                {SKILL_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Filter>
          </div>
        </aside>

        <section>
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {result.isLoading ? "Loading opportunities" : total === 0 ? "No matches" : `Showing ${from}–${to} of ${total}`}
              </p>
              <p className="text-xs text-muted-foreground">Approved listings only</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select className="w-40" value={params.get("sort") ?? "latest"} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort">
                <option value="latest">Latest</option>
                <option value="deadline">Deadline</option>
                <option value="views">Most viewed</option>
                <option value="recommended">Recommended</option>
              </Select>
              <div className="flex rounded-xl border border-border p-1">
                <Button type="button" variant={layout === "grid" ? "secondary" : "ghost"} size="icon" aria-label="Grid view" onClick={() => setLayout("grid")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button type="button" variant={layout === "list" ? "secondary" : "ghost"} size="icon" aria-label="List view" onClick={() => setLayout("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFiltersOpen((value) => !value)}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters{chips.length > 0 ? ` (${chips.length})` : ""}
              </Button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => update({ [chip.key]: "" })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-primary"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {result.isLoading && (
            <div className={layout === "grid" ? "mt-5 grid gap-4 md:grid-cols-2" : "mt-5 space-y-3"}>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-3xl border border-border bg-card" />
              ))}
            </div>
          )}

          {!result.isLoading && result.data?.items.length === 0 && (
            <div className="mt-5 rounded-3xl border border-border bg-card px-6 py-12 text-center">
              <p className="font-display text-2xl">Nothing matches these filters</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Try a broader search, or clear the filters to see every open listing.</p>
              <Button type="button" className="mt-5" onClick={() => { setDraft(""); router.push("/opportunities"); }}>
                Clear filters
              </Button>
            </div>
          )}

          {!result.isLoading && (result.data?.items.length ?? 0) > 0 && (
            <div className={layout === "grid" ? "mt-5 grid gap-4 md:grid-cols-2" : "mt-5 space-y-3"}>
              {result.data?.items.map((item) => (
                <OpportunityCard key={item.id} opportunity={item} layout={layout} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) }, false)}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TypeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function activeChips(params: URLSearchParams, categories: Category[], organizations: Organization[]) {
  const chips: { key: string; label: string }[] = [];
  const query = params.get("q");
  if (query) chips.push({ key: "q", label: `Search: ${query}` });
  const category = params.get("category");
  if (category) chips.push({ key: "category", label: categories.find((item) => item.slug === category)?.name ?? category });
  const type = params.get("type");
  if (type) chips.push({ key: "type", label: typeLabel(type) });
  const location = params.get("location");
  if (location) chips.push({ key: "location", label: location });
  if (params.get("remote") === "true") chips.push({ key: "remote", label: "Remote" });
  const deadline = params.get("deadline");
  if (deadline) chips.push({ key: "deadline", label: deadlineLabels[deadline] ?? deadline });
  const level = params.get("education_level");
  if (level) chips.push({ key: "education_level", label: level });
  const organization = params.get("organization");
  if (organization) chips.push({ key: "organization", label: organizations.find((item) => item.slug === organization)?.name ?? organization });
  const skills = params.get("skills");
  if (skills) chips.push({ key: "skills", label: skills });
  if (params.get("featured") === "true") chips.push({ key: "featured", label: "Featured" });
  return chips;
}
