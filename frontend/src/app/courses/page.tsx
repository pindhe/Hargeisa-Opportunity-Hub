import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";

export const metadata = { title: "Courses & Training" };
export default function Page() {
  return (
    <Suspense>
      <ExploreClient title="Courses & Training" defaultCategory="course" />
    </Suspense>
  );
}
