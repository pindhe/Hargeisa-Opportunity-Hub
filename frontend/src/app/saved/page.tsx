"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Opportunity } from "@/lib/types";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Button, EmptyState, Select } from "@/components/ui";

export default function SavedPage() {
  const { token, user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<{ opportunity: Opportunity }[]>([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("deadline");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const qs = new URLSearchParams({ sort, ...(category ? { category } : {}) });
    api<{ items: { opportunity: Opportunity }[] }>(`/api/saved?${qs}`, { token }).then((d) => setItems(d.items));
  }, [token, category, sort]);

  async function unsave(opportunity: Opportunity) {
    if (!token) return;
    await api(`/api/saved/${opportunity.id}`, { method: "DELETE", token });
    setItems((rows) => rows.filter((r) => r.opportunity.id !== opportunity.id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">My saved opportunities</h1>
      <div className="mt-6 flex gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-xs">
          <option value="">All categories</option>
          {["scholarship", "job", "internship", "course", "training", "competition", "hackathon"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="max-w-xs">
          <option value="deadline">Sort by deadline</option>
          <option value="recent">Recently saved</option>
        </Select>
      </div>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("emptySaved")} action={<Link href="/opportunities"><Button>{t("explore")}</Button></Link>} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((row) => (
            <OpportunityCard key={row.opportunity.id} opportunity={{ ...row.opportunity, saved: true }} onSave={unsave} />
          ))}
        </div>
      )}
    </div>
  );
}
