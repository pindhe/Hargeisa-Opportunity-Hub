import type { Metadata } from "next";
import { Suspense } from "react";

import { ExplorePage } from "./explore";

export const metadata: Metadata = { title: "Explore opportunities" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-sm text-muted-foreground">Loading opportunities…</p>}>
      <ExplorePage />
    </Suspense>
  );
}
