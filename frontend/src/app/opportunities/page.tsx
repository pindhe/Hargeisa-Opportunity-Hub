import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <Suspense>
      <ExploreClient title="Opportunities" />
    </Suspense>
  );
}
