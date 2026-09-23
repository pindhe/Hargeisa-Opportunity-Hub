"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";

import { OpportunityCard, OrgMark } from "@/components/opportunity-card";
import { api } from "@/lib/api";
import type { Opportunity, Organization } from "@/lib/types";

export function OrganizationView({ slug }: { slug: string }) {
  const result = useQuery({
    queryKey: ["organization", slug],
    queryFn: async () => (await api.get<{ organization: Organization; opportunities: Opportunity[] }>(`/api/organizations/${slug}`)).data,
  });
  const org = result.data?.organization;
  if (!org) return <p className="px-4 py-16 text-sm text-muted-foreground">Loading organization…</p>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start gap-4 rounded-[2rem] border border-border bg-white p-6">
        <OrgMark name={org.name} className="h-16 w-16" />
        <div>
          <h1 className="flex items-center gap-2 font-display text-4xl">{org.name}{org.verified && <BadgeCheck className="h-6 w-6 text-primary" />}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{org.description}</p>
          <p className="mt-3 text-sm">{org.location}{org.website && <> · <a className="text-primary" href={org.website} target="_blank" rel="noreferrer">{org.website.replace(/^https?:\/\//, "")}</a></>}</p>
        </div>
      </div>
      <h2 className="mt-8 font-display text-3xl">Available opportunities</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(result.data?.opportunities ?? []).map((item) => <OpportunityCard key={item.id} opportunity={item} />)}
      </div>
    </div>
  );
}
