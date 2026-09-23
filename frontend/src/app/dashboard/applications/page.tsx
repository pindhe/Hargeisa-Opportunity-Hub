"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DeadlineBadge } from "@/components/deadline-badge";
import { RequireAuth } from "@/components/guard";
import { api } from "@/lib/api";
import { APPLICATION_STATUSES, type Application } from "@/lib/types";
import { formatDate, statusLabel } from "@/lib/utils";

function Board() {
  const queryClient = useQueryClient();
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api.get<Application[]>("/api/applications")).data,
  });
  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/api/applications/${id}`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });
  const notes = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => api.patch(`/api/applications/${id}`, { notes: value }),
  });

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-4xl">Application tracker</h1>
        <p className="mt-2 text-sm text-muted-foreground">Drag a card to another column, or change the status menu on your phone.</p>
      </div>
      <div className="mt-6 flex gap-4 overflow-x-auto px-4 pb-6">
        {APPLICATION_STATUSES.map((status) => (
          <section
            key={status}
            className="w-72 shrink-0 rounded-3xl bg-card/80 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) move.mutate({ id, status });
            }}
          >
            <h2 className="px-1 text-sm font-semibold">{statusLabel(status)}</h2>
            <div className="mt-3 space-y-3">
              {(applications.data ?? []).filter((item) => item.status === status).map((item) => (
                <article key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} className="cursor-grab rounded-2xl border border-border bg-card p-3">
                  <Link href={`/opportunities/${item.opportunity.slug}`} className="font-medium hover:text-primary">{item.opportunity.title}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.opportunity.organization.name}</p>
                  <div className="mt-2"><DeadlineBadge days={item.opportunity.days_remaining} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">Applied {item.applied_at ? formatDate(item.applied_at) : "not yet"}</p>
                  <label className="mt-2 block text-xs text-muted-foreground">
                    Status
                    <select className="mt-1 h-9 w-full rounded-lg border border-border px-2 text-sm" value={item.status} onChange={(event) => move.mutate({ id: item.id, status: event.target.value })}>
                      {APPLICATION_STATUSES.map((option) => <option key={option} value={option}>{statusLabel(option)}</option>)}
                    </select>
                  </label>
                  <textarea
                    defaultValue={item.notes}
                    className="mt-2 w-full rounded-xl border border-border p-2 text-xs"
                    rows={3}
                    aria-label="Notes"
                    onBlur={(event) => notes.mutate({ id: item.id, value: event.target.value })}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return <RequireAuth><Board /></RequireAuth>;
}
