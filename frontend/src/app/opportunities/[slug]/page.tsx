import type { Metadata } from "next";

import { API_URL } from "@/lib/utils";
import { OpportunityView } from "./view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await fetch(`${API_URL}/api/opportunities/${slug}`, { cache: "no-store" });
    if (!response.ok) return { title: "Opportunity" };
    const data = (await response.json()) as { title: string; short_description: string };
    return { title: data.title, description: data.short_description };
  } catch {
    return { title: "Opportunity" };
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <OpportunityView slug={slug} />;
}
