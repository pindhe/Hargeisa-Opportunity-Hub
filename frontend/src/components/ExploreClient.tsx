"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOpportunityList } from "@/lib/api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Opportunity, Pagination } from "@/lib/types";
import { OpportunityCard, OpportunitySkeleton } from "@/components/OpportunityCard";
import { Button, EmptyState, Select } from "@/components/ui";
import { EDUCATION_LABELS, FUNDING_LABELS, LOCATION_LABELS } from "@/lib/format";

const CATEGORIES = ["scholarship", "job", "internship", "course", "training", "competition", "hackathon"];

export function ExploreClient({
  title,
  defaultCategory,
}: {
  title: string;
  defaultCategory?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { token } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useMemo(
    () => ({
      q: params.get("q") ?? "",
      category: params.get("category") ?? defaultCategory ?? "",
      location: params.get("location") ?? "",
      educationLevel: params.get("educationLevel") ?? "",
      fundingType: params.get("fundingType") ?? "",
      opportunityType: params.get("opportunityType") ?? "",
      deadline: params.get("deadline") ?? "",
      field: params.get("field") ?? "",
      sort: params.get("sort") ?? "recent",
      page: params.get("page") ?? "1",
    }),
    [params, defaultCategory]
  );

  useEffect(() => {
    setLoading(true);
    getOpportunityList(query, token)
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [query, token]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    router.push(`?${next.toString()}`);
  }

  async function toggleSave(opportunity: Opportunity) {
    if (!token) {
      router.push("/login");
      return;
    }
    if (opportunity.saved) {
      await api(`/api/saved/${opportunity.id}`, { method: "DELETE", token });
    } else {
      await api(`/api/saved/${opportunity.id}`, { method: "POST", token });
    }
    setItems((rows) => rows.map((row) => (row.id === opportunity.id ? { ...row, saved: !row.saved } : row)));
  }

  const Filters = (
    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-navy">{t("filters")}</h2>
      <Field label={t("category")}>
        <Select value={query.category} onChange={(e) => setFilter("category", e.target.value)}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("location")}>
        <Select value={query.location} onChange={(e) => setFilter("location", e.target.value)}>
          <option value="">All</option>
          {Object.entries(LOCATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("education")}>
        <Select value={query.educationLevel} onChange={(e) => setFilter("educationLevel", e.target.value)}>
          <option value="">All</option>
          {Object.entries(EDUCATION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("funding")}>
        <Select value={query.fundingType} onChange={(e) => setFilter("fundingType", e.target.value)}>
          <option value="">All</option>
          {Object.entries(FUNDING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("type")}>
        <Select value={query.opportunityType} onChange={(e) => setFilter("opportunityType", e.target.value)}>
          <option value="">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </Select>
      </Field>
      <Field label={t("deadline")}>
        <Select value={query.deadline} onChange={(e) => setFilter("deadline", e.target.value)}>
          <option value="">All</option>
          <option value="today">Today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
          <option value="upcoming">Upcoming</option>
        </Select>
      </Field>
      <Field label={t("field")}>
        <Select value={query.field} onChange={(e) => setFilter("field", e.target.value)}>
          <option value="">All</option>
          {[
            "Computer Science",
            "Software Engineering",
            "AI",
            "Business",
            "Accounting",
            "Economics",
            "Engineering",
            "Medicine",
            "Education",
            "Law",
            "Agriculture",
            "Social Sciences",
          ].map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </Select>
      </Field>
    </aside>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-navy">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{pagination ? `${pagination.total} results` : "Search and filter opportunities"}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)}>
            {t("filters")}
          </Button>
          <Select value={query.sort} onChange={(e) => setFilter("sort", e.target.value)} className="w-48">
            <option value="recent">{t("mostRecent")}</option>
            <option value="deadline">{t("deadlineSoonSort")}</option>
            <option value="popular">{t("mostPopular")}</option>
            <option value="recommended">{t("recommendedSort")}</option>
          </Select>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>{Filters}</div>
        <div>
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <OpportunitySkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No opportunities found" body="Try another search or clear your filters." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <OpportunityCard key={item.id} opportunity={item} onSave={toggleSave} />
              ))}
            </div>
          )}
          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: pagination.totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFilter("page", String(idx + 1))}
                  className={`h-10 w-10 rounded-xl text-sm font-semibold ${pagination.page === idx + 1 ? "bg-primary text-white" : "bg-white"}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
