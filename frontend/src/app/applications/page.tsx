"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { ApplicationItem } from "@/lib/types";
import { Button, EmptyState, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";

const STATUSES = ["planning", "applied", "shortlisted", "interview", "accepted", "rejected"];

export default function ApplicationsPage() {
  const { token, user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const qs = filter ? `?status=${filter}` : "";
    api<{ items: ApplicationItem[] }>(`/api/applications${qs}`, { token }).then((d) => setItems(d.items));
  }, [token, filter]);

  async function updateStatus(id: number, status: string) {
    if (!token) return;
    const data = await api<{ application: ApplicationItem }>(`/api/applications/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...data.application } : r)));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Application tracker</h1>
      <Select className="mt-6 max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("emptyApplications")} action={<Link href="/opportunities"><Button>{t("explore")}</Button></Link>} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/opportunities/${item.opportunity.slug}`} className="text-lg font-semibold text-navy">
                    {item.opportunity.title}
                  </Link>
                  <p className="text-sm text-slate-500">{item.opportunity.organization.name}</p>
                  <p className="mt-2 text-sm">Deadline: {formatDate(item.opportunity.deadline)}</p>
                  <p className="text-sm">Applied: {formatDate(item.appliedAt)}</p>
                </div>
                <Select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} className="w-44">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
