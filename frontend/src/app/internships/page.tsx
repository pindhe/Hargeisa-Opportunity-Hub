import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata = { title: "Internships" };
export default function Page() {
  return (
    <Suspense>
      <ExploreClient title="Internships" defaultCategory="internship" />
    </Suspense>
  );
}
