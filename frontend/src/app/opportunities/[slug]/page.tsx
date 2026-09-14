"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Opportunity } from "@/lib/types";
import { Badge, Button, EmptyState, Select, Textarea } from "@/components/ui";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EDUCATION_LABELS,
  FUNDING_LABELS,
  LOCATION_LABELS,
  daysLeft,
  formatDate,
  labelize,
} from "@/lib/format";

export default function OpportunityDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { token, user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState<{
    label: string;
    disclaimer: string;
    summary: string;
    checks: { label: string; status: string; detail: string }[];
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("incorrect");
  const [reportNote, setReportNote] = useState("");

  useEffect(() => {
    api<{ opportunity: Opportunity }>(`/api/opportunities/by-slug/${params.slug}`, { token })
      .then((data) => setOpportunity(data.opportunity))
      .catch((err) => setError(err.message));
  }, [params.slug, token]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-20"><EmptyState title={error} /></div>;
  if (!opportunity) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  const expired = opportunity.lifecycle === "expired" || opportunity.deadlineTone === "gray";

  async function save() {
    if (!token) return router.push("/login");
    if (opportunity.saved) await api(`/api/saved/${opportunity.id}`, { method: "DELETE", token });
    else await api(`/api/saved/${opportunity.id}`, { method: "POST", token });
    setOpportunity({ ...opportunity, saved: !opportunity.saved });
  }

  async function track() {
    if (!token) return router.push("/login");
    await api("/api/applications", {
      method: "POST",
      token,
      body: JSON.stringify({ opportunityId: opportunity.id, status: "applied" }),
    });
    router.push("/applications");
  }

  async function checkEligibility() {
    if (!token) return router.push("/login");
    const data = await api<{
      label: string;
      disclaimer: string;
      summary: string;
      checks: { label: string; status: string; detail: string }[];
    }>("/api/ai/eligibility", {
      method: "POST",
      token,
      body: JSON.stringify({ opportunityId: opportunity.id }),
    });
    setEligibility(data);
  }

  async function submitReport() {
    if (!token) return router.push("/login");
    await api("/api/reports", {
      method: "POST",
      token,
      body: JSON.stringify({ opportunityId: opportunity.id, reason: reportReason, description: reportNote }),
    });
    setReportOpen(false);
    setReportNote("");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: opportunity.title,
    description: opportunity.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/opportunities/${opportunity.slug}`,
    provider: { "@type": "Organization", name: opportunity.organization.name },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="rounded-3xl bg-white p-6 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={CATEGORY_COLORS[opportunity.category]}>{CATEGORY_LABELS[opportunity.category]}</Badge>
              {opportunity.verified ? <Badge className="border-blue-200 bg-blue-50 text-blue-800">✓ {t("verified")}</Badge> : null}
              {opportunity.isSample ? <Badge className="bg-slate-100 text-slate-600">{t("sample")}</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-navy">{opportunity.title}</h1>
            <p className="mt-2 text-slate-600">
              <Link href={`/organizations/${opportunity.organization.slug}`} className="font-medium text-primary">
                {opportunity.organization.name}
              </Link>
              {opportunity.organization.verified ? " · Verified organization ✓" : ""}
            </p>
          </div>
          <Button variant="secondary" onClick={save}>{opportunity.saved ? t("savedAction") : t("save")}</Button>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Info label="Location" value={labelize(opportunity.location, LOCATION_LABELS)} />
          <Info label="Deadline" value={`${formatDate(opportunity.deadline)} · ${daysLeft(opportunity.deadline)}`} />
          <Info label="Education" value={labelize(opportunity.educationLevel, EDUCATION_LABELS)} />
          <Info label="Funding" value={labelize(opportunity.fundingType, FUNDING_LABELS)} />
        </dl>

        {expired ? <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{t("expired")}</p> : null}

        <Section title="Overview">
          <p className="whitespace-pre-wrap leading-7 text-slate-700">{opportunity.description}</p>
        </Section>
        {opportunity.requirements ? <Section title="Requirements"><p className="whitespace-pre-wrap leading-7 text-slate-700">{opportunity.requirements}</p></Section> : null}
        {opportunity.benefits ? <Section title="Benefits"><p className="whitespace-pre-wrap leading-7 text-slate-700">{opportunity.benefits}</p></Section> : null}
        {opportunity.applicationProcess ? <Section title="Application process"><p className="whitespace-pre-wrap leading-7 text-slate-700">{opportunity.applicationProcess}</p></Section> : null}
        {opportunity.requiredDocuments.length ? (
          <Section title="Required documents">
            <ul className="list-disc pl-5 text-slate-700">
              {opportunity.requiredDocuments.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </Section>
        ) : null}
        <Section title="Important dates">
          <ul className="space-y-1 text-sm text-slate-700">
            <li>Opening date: {formatDate(opportunity.openingDate)}</li>
            <li>Deadline: {formatDate(opportunity.deadline)}</li>
            <li>Interview date: {formatDate(opportunity.interviewDate)}</li>
            <li>Result date: {formatDate(opportunity.resultDate)}</li>
          </ul>
        </Section>

        <div className="mt-8 flex flex-wrap gap-3">
          {expired ? null : opportunity.applicationMode === "internal" ? (
            <Button onClick={track}>{t("applyInternal")}</Button>
          ) : opportunity.applicationUrl ? (
            <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer">
              <Button>{t("applyNow")}</Button>
            </a>
          ) : (
            <p className="text-sm text-slate-500">Application link is unavailable.</p>
          )}
          <Button variant="secondary" onClick={checkEligibility}>{t("checkEligibility")}</Button>
          <Button variant="ghost" onClick={() => setReportOpen((v) => !v)}>{t("report")}</Button>
        </div>

        {eligibility ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="font-semibold text-navy">{eligibility.label}</p>
            <p className="mt-1 text-sm text-slate-600">{eligibility.disclaimer}</p>
            <p className="mt-3 text-sm leading-6">{eligibility.summary}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {eligibility.checks.map((c) => (
                <li key={c.label}>
                  {c.status === "pass" ? "✅" : c.status === "fail" ? "❌" : "⚠️"} {c.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {reportOpen ? (
          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
            <Select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              <option value="fake">Fake opportunity</option>
              <option value="incorrect">Incorrect information</option>
              <option value="expired">Expired opportunity</option>
              <option value="scam">Scam</option>
              <option value="broken_link">Broken application link</option>
              <option value="other">Other</option>
            </Select>
            <Textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} rows={3} placeholder="Optional details" />
            <Button onClick={submitReport}>Submit report</Button>
          </div>
        ) : null}
        {user ? null : <p className="mt-4 text-sm text-slate-500">Log in to save, track applications and check eligibility.</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-navy">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-navy">{value}</dd>
    </div>
  );
}
