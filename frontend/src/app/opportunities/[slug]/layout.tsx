import { API_URL } from "@/lib/api";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/api/opportunities/by-slug/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return { title: "Opportunity" };
    const data = await res.json();
    const opp = data.opportunity;
    const description = String(opp.description ?? "").slice(0, 160);
    return {
      title: opp.title,
      description,
      openGraph: { title: opp.title, description },
      twitter: { card: "summary_large_image", title: opp.title, description },
    };
  } catch {
    return { title: "Opportunity" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
