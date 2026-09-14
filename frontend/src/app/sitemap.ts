import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes = ["", "/opportunities", "/scholarships", "/internships", "/jobs", "/courses", "/competitions", "/about"].map(
    (path) => ({ url: `${base}${path}`, lastModified: new Date() })
  );
  try {
    const res = await fetch(`${API_URL}/api/opportunities?pageSize=50`);
    const data = await res.json();
    const oppRoutes = (data.items ?? []).map((item: { slug: string; updatedAt?: string }) => ({
      url: `${base}/opportunities/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));
    return [...staticRoutes, ...oppRoutes];
  } catch {
    return staticRoutes;
  }
}
