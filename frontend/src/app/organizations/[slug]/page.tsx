"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/ui";

export default function OrganizationPage() {
  const params = useParams<{ slug: string }>();
  const [org, setOrg] = useState<{
    name: string;
    description?: string;
    website?: string;
    location?: string;
    verified: boolean;
    isSample: boolean;
    opportunities: Opportunity[];
  } | null>(null);

  useEffect(() => {
    api<{ organization: typeof org }>(`/api/organizations/${params.slug}`).then((d) => setOrg(d.organization));
  }, [params.slug]);

  if (!org) return <div className="mx-auto max-w-5xl px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-white" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-3xl bg-white p-8">
        <p className="text-sm text-slate-500">{org.isSample ? "Sample organization" : "Organization"}</p>
        <h1 className="mt-2 text-3xl font-semibold text-navy">{org.name}</h1>
        {org.verified ? <p className="mt-2 text-sm font-semibold text-accent">Verified organization ✓</p> : null}
        <p className="mt-4 max-w-2xl leading-7 text-slate-700">{org.description}</p>
        {org.website ? <a className="mt-3 inline-block text-sm font-semibold text-primary" href={org.website} target="_blank" rel="noreferrer">{org.website}</a> : null}
      </div>
      <h2 className="mt-10 text-2xl font-semibold text-navy">Active opportunities</h2>
      {org.opportunities.length === 0 ? (
        <div className="mt-6"><EmptyState title="No active opportunities." /></div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {org.opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}
    </div>
  );
}
