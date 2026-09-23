"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, MapPin, Share2 } from "lucide-react";
import { useState } from "react";

import { DeadlineBadge } from "@/components/deadline-badge";
import { Loading } from "@/components/loading";
import { OpportunityCard, OrgMark } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/providers";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Opportunity } from "@/lib/types";
import { formatDate, mediaUrl, typeLabel } from "@/lib/utils";

const reasons = ["Incorrect information", "Expired", "Spam", "Scam", "Other"];

export function OpportunityView({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const detail = useQuery({
    queryKey: ["opportunity", slug],
    queryFn: async () => (await api.get<Opportunity>(`/api/opportunities/${slug}?count=true`)).data,
  });
  const related = useQuery({
    queryKey: ["related", slug],
    queryFn: async () => (await api.get<Opportunity[]>(`/api/opportunities/${slug}/related`)).data,
  });
  const opp = detail.data;

  async function save() {
    if (!user || !opp) {
      window.location.href = `/login?next=/opportunities/${slug}`;
      return;
    }
    if (opp.bookmarked) await api.delete(`/api/bookmarks/${opp.id}`);
    else await api.post("/api/bookmarks", { opportunity_id: opp.id });
    void queryClient.invalidateQueries({ queryKey: ["opportunity", slug] });
  }

  async function track(status: string) {
    if (!user || !opp) {
      window.location.href = `/login?next=/opportunities/${slug}`;
      return;
    }
    await api.post("/api/applications", { opportunity_id: opp.id, status });
    toast.push(status === "APPLIED" ? "Marked as applied." : "Added to your tracker.");
    void queryClient.invalidateQueries({ queryKey: ["opportunity", slug] });
  }

  if (detail.isLoading) return <Loading label="Loading opportunity" />;
  if (!opp) return <p className="px-4 py-16">This opportunity is not available.</p>;

  const cover = opp.image ? mediaUrl(opp.image) : "/bghero-straight.jpg";

  return (
    <div>
      <section className="relative h-[28rem] overflow-hidden sm:h-[32rem]">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_40%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,16,0.15)_0%,rgba(7,21,16,0.2)_40%,rgba(7,21,16,0.82)_100%)]" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-10 text-white">
          <div className="flex items-center gap-3">
            <OrgMark name={opp.organization.name} logo={opp.organization.logo} className="h-12 w-12 bg-white" />
            <Link href={`/organizations/${opp.organization.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-white">
              {opp.organization.name}
              {opp.organization.verified && <BadgeCheck className="h-4 w-4 text-emerald-200" />}
            </Link>
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">{opp.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">{opp.category.name}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">{typeLabel(opp.opportunity_type)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" />
              {opp.is_remote ? "Remote" : `${opp.location}, ${opp.country}`}
            </span>
            <DeadlineBadge days={opp.days_remaining} />
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <article className="rounded-[2rem] border border-border bg-card px-6 py-8 md:px-10">
          <p className="max-w-2xl text-xl leading-9">{opp.short_description}</p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <DateItem label="Deadline" value={formatDate(opp.deadline)} />
            <DateItem label="Starts" value={formatDate(opp.start_date)} />
            <DateItem label="Ends" value={formatDate(opp.end_date)} />
          </dl>
          <Section title="Description" body={opp.description} />
          <Section title="Eligibility" body={opp.eligibility} />
          <Section title="Requirements" body={opp.requirements} />
          <Section title="Benefits" body={opp.benefits} />
          {!!opp.skills?.length && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-display text-2xl">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {opp.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </section>
          )}
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="font-display text-2xl">Application process</h2>
            <ol className="mt-4 max-w-2xl list-decimal space-y-3 pl-5 text-base leading-8 text-foreground/80">
              <li>Check the eligibility and deadline on this page.</li>
              <li>Open the official application link and submit there.</li>
              <li>Save the opportunity and track the status on your HOH board.</li>
            </ol>
          </section>
          <button type="button" className="mt-8 text-sm text-muted-foreground underline" onClick={() => (user ? setReportOpen(true) : (window.location.href = "/login"))}>
            Report this listing
          </button>
        </article>
        <aside className="h-fit space-y-3 rounded-[2rem] border border-border bg-card p-5 lg:sticky lg:top-24">
          <DeadlineBadge days={opp.days_remaining} />
          <p className="text-sm text-muted-foreground">Deadline {formatDate(opp.deadline)}</p>
          <Button className="w-full" onClick={() => opp.application_url && window.open(opp.application_url, "_blank", "noopener,noreferrer")}>
            Apply Now
          </Button>
          <Button className="w-full" variant="outline" onClick={() => void save()}>
            <Bookmark className="h-4 w-4" /> {opp.bookmarked ? "Saved" : "Save Opportunity"}
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => {
              if (opp.application_status) router.push("/dashboard/applications");
              else void track("PLANNED");
            }}
          >
            {opp.application_status ? "Open tracker" : "Track Application"}
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              toast.push("Link copied.");
            }}
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          {user && (
            <Button className="w-full" variant="outline" onClick={() => void track("APPLIED")}>
              Mark as applied
            </Button>
          )}
        </aside>
      </div>
      <section className="mx-auto mt-2 max-w-6xl px-4 pb-12">
        <h2 className="font-display text-3xl">Related opportunities</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(related.data ?? []).map((item) => (
            <OpportunityCard key={item.id} opportunity={item} />
          ))}
        </div>
      </section>
      <Modal open={reportOpen} onOpenChange={setReportOpen} title="Report opportunity">
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api.post("/api/reports", { opportunity_id: opp.id, reason, description });
              toast.push("Report sent.");
              setReportOpen(false);
            } catch (error) {
              toast.push(errorMessage(error));
            }
          }}
        >
          <Label>Reason</Label>
          <Select value={reason} onChange={(event) => setReason(event.target.value)}>
            {reasons.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Label>Description</Label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What looks wrong?" />
          <Button type="submit">Submit report</Button>
        </form>
      </Modal>
    </div>
  );
}

function Section({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={`${title}-${index}`} className="whitespace-pre-wrap text-base leading-8 text-foreground/85">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

function DateItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
