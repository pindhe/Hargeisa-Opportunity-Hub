"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Opportunity } from "@/lib/types";
import { Button } from "@/components/ui";

export default function OrgDashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (!loading && user && user.role !== "organization" && user.role !== "admin") router.push("/dashboard");
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    api<{ items: Opportunity[] }>("/api/opportunities?includeExpired=true&pageSize=50", { token }).then((d) => {
      setItems(d.items.filter((o) => user?.organizationId && o.organization.id === user.organizationId));
    });
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-navy">Organization dashboard</h1>
        <Link href="/org/opportunities/new"><Button>Submit opportunity</Button></Link>
      </div>
      <p className="mt-2 text-sm text-slate-600">New listings go to pending review until an admin publishes them.</p>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4">
            <div>
              <p className="font-semibold text-navy">{item.title}</p>
              <p className="text-sm capitalize text-slate-500">{item.status} · {item.category}</p>
            </div>
            <Link href={`/opportunities/${item.slug}`} className="text-sm font-semibold text-primary">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
