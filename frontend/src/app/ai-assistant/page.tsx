"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AssistantPage() {
  const router = useRouter();

  useEffect(() => {
    window.dispatchEvent(new Event("hoh-open-assistant"));
    router.replace("/");
  }, [router]);

  return null;
}
