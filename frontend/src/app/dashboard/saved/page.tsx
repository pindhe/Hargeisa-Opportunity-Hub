"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DeadlineBadge } from "@/components/deadline-badge";
import { RequireAuth } from "@/components/guard";
import { OrgMark } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";

function Saved() {
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: ["bookmarks"], queryFn: async () => (await api.get<Opportunity[]>("/api/bookmarks")).data });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/bookmarks/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });
  const track = useMutation({
    mutationFn: async (id: string) => api.post("/api/applications", { opportunity_id: id, status: "SAVED" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl">Saved opportunities</h1>
      <div className="mt-6 space-y-3">
        {(saved.data ?? []).map((item) => (
          <article key={item.id} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <OrgMark name={item.organization.name} logo={item.organization.logo} className="h-14 w-24" />
            <div className="min-w-0 flex-1">
              <Link href={`/opportunities/${item.slug}`} className="font-semibold hover:text-primary">{item.title}</Link>
              <p className="text-sm text-muted-foreground">{item.organization.name}</p>
              <div className="mt-2"><DeadlineBadge days={item.days_remaining} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href={`/opportunities/${item.slug}`}>Open</Link></Button>
              <Button size="sm" variant="secondary" onClick={() => track.mutate(item.id)} disabled={Boolean(item.application_status)}>
                {item.application_status ? "In tracker" : "Add to tracker"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(item.id)}>Remove</Button>
            </div>
          </article>
        ))}
        {saved.data?.length === 0 && <p className="text-sm text-muted-foreground">You have not saved an opportunity yet.</p>}
      </div>
    </div>
  );
}

export default function SavedPage() {
  return <RequireAuth><Saved /></RequireAuth>;
}
