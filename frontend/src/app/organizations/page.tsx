"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";

import { OrgMark } from "@/components/opportunity-card";
import { api } from "@/lib/api";
import type { Organization } from "@/lib/types";

export default function OrganizationsPage() {
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: async () => (await api.get<Organization[]>("/api/organizations")).data });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">Organizations</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(organizations.data ?? []).map((org) => (
          <Link key={org.id} href={`/organizations/${org.slug}`} className="flex gap-4 rounded-[1.7rem] border border-border bg-white p-5">
            <OrgMark name={org.name} />
            <div>
              <h2 className="flex items-center gap-1 text-lg font-semibold">{org.name}{org.verified && <BadgeCheck className="h-4 w-4 text-primary" />}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{org.description}</p>
              <p className="mt-2 text-sm text-primary">{org.opportunity_count} opportunities · {org.location}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
