"use client";

import { OpportunityForm, emptyOpportunity } from "@/components/opportunity-form";

export default function CreateOpportunityPage() {
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Add opportunity</h1>
      <OpportunityForm initial={emptyOpportunity} levels={["Bachelor"]} />
    </div>
  );
}
