"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Calendar, GraduationCap, MapPin } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EDUCATION_LABELS,
  FUNDING_LABELS,
  LOCATION_LABELS,
  daysLeft,
  formatDate,
  initials,
  labelize,
} from "@/lib/format";
import { Badge } from "./ui";

const TONE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-slate-100 text-slate-500 border-slate-200",
};

export function OpportunityCard({
  opportunity,
  onSave,
}: {
  opportunity: Opportunity;
  onSave?: (opportunity: Opportunity) => void;
}) {
  const { t } = useI18n();
  return (
    <article className="card-shadow group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-sm font-bold text-white">
            {opportunity.organization.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={opportunity.organization.logo} alt="" className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              initials(opportunity.organization.name)
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{opportunity.organization.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge className={CATEGORY_COLORS[opportunity.category] ?? "bg-slate-50 text-slate-700"}>
                {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
              </Badge>
              {opportunity.verified ? <Badge className="border-blue-200 bg-blue-50 text-blue-800">✓ {t("verified")}</Badge> : null}
              {opportunity.isSample ? <Badge className="border-slate-200 bg-slate-50 text-slate-600">{t("sample")}</Badge> : null}
            </div>
          </div>
        </div>
        {onSave ? (
          <button
            type="button"
            onClick={() => onSave(opportunity)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
            aria-label={opportunity.saved ? t("savedAction") : t("save")}
          >
            {opportunity.saved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
          </button>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-navy">
        <Link href={`/opportunities/${opportunity.slug}`} className="hover:text-accent">
          {opportunity.title}
        </Link>
      </h3>

      {opportunity.matchScore ? (
        <p className="mt-2 text-sm font-semibold text-accent">{opportunity.matchScore}% match</p>
      ) : null}

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" /> {labelize(opportunity.location, LOCATION_LABELS)}
        </li>
        <li className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-slate-400" /> {labelize(opportunity.educationLevel, EDUCATION_LABELS)}
        </li>
        <li className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" /> {t("deadline")}: {formatDate(opportunity.deadline)}
        </li>
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Badge className={TONE[opportunity.deadlineTone]}>{daysLeft(opportunity.deadline)}</Badge>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          {opportunity.fundingType ? <span>{labelize(opportunity.fundingType, FUNDING_LABELS)}</span> : null}
        </div>
      </div>
      <Link
        href={`/opportunities/${opportunity.slug}`}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-primary transition group-hover:bg-blue-50"
      >
        {t("viewDetails")}
      </Link>
    </article>
  );
}

export function OpportunitySkeleton() {
  return (
    <div className="h-[320px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-6 h-6 w-3/4 rounded bg-slate-200" />
      <div className="mt-6 space-y-2">
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}
