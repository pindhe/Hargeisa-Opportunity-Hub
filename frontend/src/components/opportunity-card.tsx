"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, MapPin } from "lucide-react";

import { DeadlineBadge } from "@/components/deadline-badge";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Opportunity } from "@/lib/types";
import { cn, formatDate, initials, mediaUrl, typeLabel } from "@/lib/utils";

export function OrgMark({ name, logo, className }: { name: string; logo?: string | null; className?: string }) {
  if (logo) {
    return (
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1", className)}>
        <img src={mediaUrl(logo)} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-xs font-semibold tracking-wide text-white", className)}>
      {initials(name)}
    </div>
  );
}

export function OpportunityCard({
  opportunity,
  layout = "grid",
}: {
  opportunity: Opportunity;
  layout?: "grid" | "list";
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (opportunity.bookmarked) await api.delete(`/api/bookmarks/${opportunity.id}`);
      else await api.post("/api/bookmarks", { opportunity_id: opportunity.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-3xl border border-border bg-card p-4 shadow-[0_16px_40px_-32px_rgba(16,35,28,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-28px_rgba(12,107,88,0.45)]",
        layout === "list" && "sm:flex-row sm:items-center sm:gap-5",
      )}
    >
      <div className={cn("flex items-start gap-3", layout === "list" && "sm:w-[46%]")}>
        <OrgMark name={opportunity.organization.name} logo={opportunity.organization.logo} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{opportunity.organization.name}</p>
          <h3 className="mt-1 font-display text-lg leading-snug tracking-tight">
            <Link href={`/opportunities/${opportunity.slug}`} className="hover:text-primary">
              {opportunity.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className={cn("mt-3 line-clamp-2 text-sm text-muted-foreground", layout === "list" && "sm:mt-0 sm:flex-1")}>
        {opportunity.short_description}
      </p>
      <div className={cn("mt-4 flex flex-wrap items-center gap-2", layout === "list" && "sm:mt-0 sm:max-w-xs sm:justify-end")}>
        <Badge>{opportunity.category.name}</Badge>
        <Badge className="bg-muted text-foreground">{typeLabel(opportunity.opportunity_type)}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {opportunity.is_remote ? "Remote" : opportunity.location}
        </span>
        <DeadlineBadge days={opportunity.days_remaining} />
      </div>
      {opportunity.tags.length > 0 && (
        <div className={cn("mt-3 flex flex-wrap gap-1.5", layout === "list" && "sm:hidden")}>
          {opportunity.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
      {opportunity.recommendation_reason && (
        <p className="mt-3 text-xs leading-5 text-primary">{opportunity.recommendation_reason}</p>
      )}
      <div className={cn("mt-4 flex items-center justify-between gap-3", layout === "list" && "sm:mt-0 sm:w-auto")}>
        <p className="text-xs text-muted-foreground">{formatDate(opportunity.deadline)}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={opportunity.bookmarked ? "Remove bookmark" : "Save opportunity"}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border hover:bg-muted"
            onClick={() => {
              if (!user) {
                window.location.href = `/login?next=/opportunities/${opportunity.slug}`;
                return;
              }
              mutation.mutate();
            }}
          >
            <Bookmark className={cn("h-4 w-4", opportunity.bookmarked && "fill-primary text-primary")} />
          </button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/opportunities/${opportunity.slug}`}>View details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
