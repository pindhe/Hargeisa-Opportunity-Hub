"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function OpenSearch() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hoh-open-search", { detail: params.get("q") ?? "" }));
    router.replace("/");
  }, [params, router]);

  return null;
}

export default function SearchPage() {
  return (
    <Suspense>
      <OpenSearch />
    </Suspense>
  );
}
