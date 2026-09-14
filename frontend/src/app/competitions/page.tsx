import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata = { title: "Competitions" };
export default function Page() {
  return (
    <Suspense>
      <ExploreClient title="Competitions" defaultCategory="competition" />
    </Suspense>
  );
}
