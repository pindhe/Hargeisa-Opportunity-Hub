"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { OpportunityCard } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { EDUCATION_LEVELS, LOCATION_OPTIONS, OPPORTUNITY_TYPES, SKILL_OPTIONS, type Category, type Organization, type PageResult } from "@/lib/types";
import { typeLabel } from "@/lib/utils";

export function ExplorePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = params.toString();
  const result = useQuery({
    queryKey: ["opportunities", query],
    queryFn: async () => (await api.get<PageResult>(`/api/opportunities?${query || "page=1"}`)).data,
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get<Category[]>("/api/categories")).data });
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: async () => (await api.get<Organization[]>("/api/organizations")).data });

  function update(next: Record<string, string>, resetPage = true) {
    const draft = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) draft.delete(key);
      else draft.set(key, value);
    });
    if (resetPage) draft.delete("page");
    router.push(`/opportunities?${draft.toString()}`);
  }

  const page = Number(params.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil((result.data?.total ?? 0) / (result.data?.page_size ?? 12)));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
      <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
        <div className="space-y-4 rounded-3xl border border-border bg-card p-4">
          <p className="font-semibold">Filters</p>
          <Filter label="Category">
            <Select value={params.get("category") ?? ""} onChange={(event) => update({ category: event.target.value })}>
              <option value="">All categories</option>
              {(categories.data ?? []).map((item) => (
                <option key={item.id} value={item.slug}>{item.name}</option>
              ))}
            </Select>
          </Filter>
          <Filter label="Opportunity type">
            <Select value={params.get("type") ?? ""} onChange={(event) => update({ type: event.target.value })}>
              <option value="">All types</option>
              {OPPORTUNITY_TYPES.map((type) => (
                <option key={type} value={type}>{typeLabel(type)}</option>
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
          <label className="flex items-center gap-2 text-sm">
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
          <Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/opportunities")}>
            Clear filters
          </Button>
        </div>
      </aside>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            defaultValue={params.get("q") ?? ""}
            placeholder="Search opportunities"
            aria-label="Search opportunities"
            onKeyDown={(event) => {
              if (event.key === "Enter") update({ q: event.currentTarget.value });
            }}
          />
          <Select className="sm:w-48" value={params.get("sort") ?? "latest"} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort">
            <option value="latest">Latest</option>
            <option value="deadline">Deadline</option>
            <option value="views">Most viewed</option>
            <option value="recommended">Recommended</option>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant={layout === "grid" ? "secondary" : "outline"} size="icon" aria-label="Grid view" onClick={() => setLayout("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button type="button" variant={layout === "list" ? "secondary" : "outline"} size="icon" aria-label="List view" onClick={() => setLayout("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFiltersOpen((value) => !value)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{result.data ? `${result.data.total} opportunities` : "Loading…"}</p>
        <div className={layout === "grid" ? "mt-4 grid gap-4 md:grid-cols-2" : "mt-4 space-y-3"}>
          {(result.data?.items ?? []).map((item) => (
            <OpportunityCard key={item.id} opportunity={item} layout={layout} />
          ))}
        </div>
        {result.data?.items.length === 0 && <p className="mt-8 rounded-3xl bg-card p-8 text-sm text-muted-foreground">No opportunities match these filters.</p>}
        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => {
            const draft = new URLSearchParams(params.toString());
            draft.set("page", String(page + 1));
            router.push(`/opportunities?${draft.toString()}`);
          }}>Next</Button>
        </div>
      </section>
    </div>
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
