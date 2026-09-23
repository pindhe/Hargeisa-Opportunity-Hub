"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { RequireAuth } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function Center() {
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get<Notification[]>("/api/notifications")).data });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Notifications</h1>
        <Button variant="outline" onClick={async () => { await api.post("/api/notifications/read-all"); void queryClient.invalidateQueries(); }}>Mark all read</Button>
      </div>
      <div className="mt-6 space-y-2">
        {(notes.data ?? []).map((item) => (
          <Link key={item.id} href={item.link || "/notifications"} onClick={() => void api.post(`/api/notifications/${item.id}/read`)} className={cn("block rounded-3xl border border-border bg-white p-4", !item.is_read && "border-primary/30 bg-accent/40")}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.title}</p>
              <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-primary">{item.type.replaceAll("_", " ")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return <RequireAuth><Center /></RequireAuth>;
}
