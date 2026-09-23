"use client";

import { useQuery } from "@tanstack/react-query";

import { OpportunityForm, type OpportunityFormValues } from "@/components/opportunity-form";
import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function EditOpportunity({ id }: { id: string }) {
  const detail = useQuery({
    queryKey: ["admin-opp", id],
    queryFn: async () => (await api.get<Opportunity>(`/api/admin/opportunities/${id}`)).data,
  });
  if (!detail.data) return <p className="text-sm text-muted-foreground">Loading opportunity…</p>;
  const item = detail.data;
  const initial: OpportunityFormValues = {
    title: item.title,
    short_description: item.short_description,
    description: item.description ?? "",
    organization_id: item.organization.id,
    category_id: item.category.id,
    opportunity_type: item.opportunity_type,
    location: item.location,
    country: item.country,
    is_remote: item.is_remote,
    deadline: dateInput(item.deadline),
    start_date: dateInput(item.start_date),
    end_date: dateInput(item.end_date),
    eligibility: item.eligibility ?? "",
    requirements: item.requirements ?? "",
    benefits: item.benefits ?? "",
    application_url: item.application_url ?? "",
    image: item.image ?? "",
    tags: item.tags.join(", "),
    skills: item.skills.join(", "),
    featured: item.featured,
    status: item.status,
  };
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Edit opportunity</h1>
      <OpportunityForm initial={initial} levels={item.education_levels ?? []} opportunityId={item.id} />
    </div>
  );
}
