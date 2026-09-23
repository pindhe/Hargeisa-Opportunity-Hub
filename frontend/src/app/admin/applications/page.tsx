"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { APPLICATION_STATUSES } from "@/lib/types";
import { cn, formatDate, statusLabel } from "@/lib/utils";

type Row = {
  id: string;
  status: string;
  user_name: string;
  user_email: string;
  opportunity_title: string;
  opportunity_slug: string;
  applied_at: string | null;
};

export default function AdminApplicationsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const rows = useQuery({ queryKey: ["admin-apps"], queryFn: async () => (await api.get<Row[]>("/api/admin/applications")).data });
  const counts = useMemo(() => {
    const items = rows.data ?? [];
    return Object.fromEntries(APPLICATION_STATUSES.map((item) => [item, items.filter((row) => row.status === item).length]));
  }, [rows.data]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (rows.data ?? []).filter((row) => {
      const matchesStatus = status === "ALL" || row.status === status;
      const matchesQuery = !needle || `${row.user_name} ${row.user_email} ${row.opportunity_title}`.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [query, rows.data, status]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">People</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Applications</h1>
      <p className="mt-2 text-sm text-muted-foreground">{rows.data?.length ?? 0} tracked applications</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Filter active={status === "ALL"} onClick={() => setStatus("ALL")} label={`All ${rows.data?.length ?? 0}`} />
        {APPLICATION_STATUSES.map((item) => (
          <Filter key={item} active={status === item} onClick={() => setStatus(item)} label={`${statusLabel(item)} ${counts[item] ?? 0}`} />
        ))}
      </div>
      <div className="mt-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search person or listing" aria-label="Search applications" className="max-w-sm" />
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((row) => (
          <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-border bg-card px-4 py-4">
            <div className="min-w-0">
              <p className="font-semibold">{row.user_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.user_email}</p>
              <Link href={`/opportunities/${row.opportunity_slug}`} className="mt-2 inline-block text-sm font-medium text-primary">{row.opportunity_title}</Link>
            </div>
            <div className="text-right">
              <p className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-primary">{statusLabel(row.status)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{row.applied_at ? formatDate(row.applied_at) : "Not applied yet"}</p>
            </div>
          </article>
        ))}
        {!rows.isLoading && visible.length === 0 && <p className="text-sm text-muted-foreground">No applications in this view.</p>}
      </div>
    </div>
  );
}

function Filter({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm",
        active ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
