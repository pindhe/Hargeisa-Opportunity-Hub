import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata = { title: "Scholarships" };
export default function Page() {
  return (
    <Suspense>
      <ExploreClient title="Scholarships" defaultCategory="scholarship" />
    </Suspense>
  );
}
