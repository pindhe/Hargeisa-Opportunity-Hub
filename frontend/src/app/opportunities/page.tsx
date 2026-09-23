import type { Metadata } from "next";
import { Suspense } from "react";

import { Loading } from "@/components/loading";

import { ExplorePage } from "./explore";

export const metadata: Metadata = { title: "Explore opportunities" };

export default function Page() {
  return (
    <Suspense fallback={<Loading label="Loading opportunities" />}>
      <ExplorePage />
    </Suspense>
  );
}
