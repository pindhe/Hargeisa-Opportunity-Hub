import slugify from "slugify";
import { prisma } from "./prisma";

export async function uniqueSlug(base: string) {
  const root = slugify(base, { lower: true, strict: true }).slice(0, 80) || "opportunity";
  let slug = root;
  let i = 2;
  while (await prisma.opportunity.findUnique({ where: { slug } })) {
    slug = `${root}-${i}`;
    i += 1;
  }
  return slug;
}

export async function uniqueOrgSlug(base: string) {
  const root = slugify(base, { lower: true, strict: true }).slice(0, 80) || "organization";
  let slug = root;
  let i = 2;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${root}-${i}`;
    i += 1;
  }
  return slug;
}
