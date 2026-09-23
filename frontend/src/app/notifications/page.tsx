"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, CalendarDays, Sparkles, BadgeCheck } from "lucide-react";
import { useState } from "react";

import { RequireAuth } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const filters = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "DEADLINE", label: "Deadlines" },
  { id: "NEW_OPPORTUNITY", label: "New listings" },
  { id: "RECOMMENDATION", label: "Matches" },
  { id: "APPLICATION", label: "Applications" },
  { id: "SYSTEM", label: "Updates" },
] as const;

const kinds: Record<string, { label: string; icon: typeof Bell }> = {
  DEADLINE: { label: "Deadline", icon: CalendarDays },
  NEW_OPPORTUNITY: { label: "New listing", icon: BadgeCheck },
  RECOMMENDATION: { label: "Match", icon: Sparkles },
  APPLICATION: { label: "Application", icon: Briefcase },
  SYSTEM: { label: "Update", icon: Bell },
};

function Center() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("ALL");
  const notes = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get<Notification[]>("/api/notifications")).data });
  const items = notes.data ?? [];
  const unread = items.filter((item) => !item.is_read).length;
  const visible = items.filter((item) => {
    if (filter === "UNREAD") return !item.is_read;
    if (filter === "ALL") return true;
    return item.type === filter;
  });

  async function markAll() {
    await api.post("/api/notifications/read-all");
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["unread"] });
  }

  async function openNote(item: Notification) {
    if (!item.is_read) {
      await api.post(`/api/notifications/${item.id}/read`);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unread"] });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Inbox</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {notes.isLoading ? "Loading your notices…" : unread === 0 ? "You are caught up." : `${unread} unread`}
          </p>
        </div>
        <Button variant="outline" disabled={unread === 0} onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              filter === item.id ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.id === "UNREAD" && unread > 0 ? ` ${unread}` : ""}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((item) => {
          const kind = kinds[item.type] ?? kinds.SYSTEM;
          const Icon = kind.icon;
          return (
            <Link
              key={item.id}
              href={item.link || "/notifications"}
              onClick={() => void openNote(item)}
              className={cn(
                "flex gap-4 rounded-[1.4rem] border border-border bg-card p-4 transition hover:border-primary/40",
                !item.is_read && "border-primary/30 bg-accent/50",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{item.title}</span>
                  {!item.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.message}</span>
                <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{kind.label}</span>
                  <span>{formatDate(item.created_at)}</span>
                </span>
              </span>
            </Link>
          );
        })}
        {!notes.isLoading && visible.length === 0 && (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-12 text-center">
            <p className="font-display text-2xl">Nothing here</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "ALL" ? "New deadlines, matches, and listing updates will show up in this list." : "No notices in this filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Center />
    </RequireAuth>
  );
}
