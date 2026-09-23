"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CategoryIcon } from "@/components/category-icon";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get<Category[]>("/api/categories")).data });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">Categories</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Browse the kinds of opportunities students and graduates ask for most.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories.data ?? []).map((category) => (
          <Link key={category.id} href={`/opportunities?category=${category.slug}`} className="rounded-[1.7rem] border border-border bg-card p-5 hover:border-primary/40">
            <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${category.color}18`, color: category.color }}>
              <CategoryIcon name={category.icon} className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">{category.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
            <p className="mt-4 text-sm font-semibold text-primary">{category.opportunity_count} opportunities</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
