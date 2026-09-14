"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/lib/types";
import { Button, EmptyState } from "@/components/ui";

export default function NotificationsPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    api<{ items: NotificationItem[] }>("/api/notifications", { token }).then((d) => setItems(d.items));
  }, [token]);

  async function readAll() {
    if (!token) return;
    await api("/api/notifications/read-all", { method: "POST", token });
    setItems((rows) => rows.map((r) => ({ ...r, read: true })));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-navy">Notifications</h1>
        <Button variant="secondary" onClick={readAll}>Mark all read</Button>
      </div>
      {items.length === 0 ? (
        <div className="mt-8"><EmptyState title="No notifications yet." /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`rounded-2xl p-5 ${item.read ? "bg-white" : "bg-blue-50"}`}>
              <p className="font-semibold text-navy">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.message}</p>
              {item.link ? <Link href={item.link} className="mt-2 inline-block text-sm font-semibold text-primary">Open</Link> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
