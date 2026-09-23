import type { Metadata } from "next";

import { OrganizationView } from "./view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <OrganizationView slug={slug} />;
}
