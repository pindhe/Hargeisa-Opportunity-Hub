"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, Share2 } from "lucide-react";
import { useState } from "react";

import { DeadlineBadge } from "@/components/deadline-badge";
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
import { formatDate, typeLabel } from "@/lib/utils";

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

  if (detail.isLoading) return <p className="px-4 py-16 text-sm text-muted-foreground">Loading opportunity…</p>;
  if (!opp) return <p className="px-4 py-16">This opportunity is not available.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <OrgMark name={opp.organization.name} logo={opp.organization.logo} className="h-16 w-28" />
            <div>
              <Link href={`/organizations/${opp.organization.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {opp.organization.name}
                {opp.organization.verified && <BadgeCheck className="h-4 w-4" />}
              </Link>
              <h1 className="mt-1 font-display text-4xl leading-tight">{opp.title}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{opp.category.name}</Badge>
            <Badge className="bg-muted text-foreground">{typeLabel(opp.opportunity_type)}</Badge>
            <Badge className="bg-muted text-foreground">{opp.is_remote ? "Remote" : `${opp.location}, ${opp.country}`}</Badge>
            <DeadlineBadge days={opp.days_remaining} />
          </div>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{opp.short_description}</p>
          <Section title="Description" body={opp.description} />
          <Section title="Eligibility" body={opp.eligibility} />
          <Section title="Requirements" body={opp.requirements} />
          <Section title="Benefits" body={opp.benefits} />
          <h2 className="mt-8 font-display text-2xl">Important dates</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <DateItem label="Deadline" value={formatDate(opp.deadline)} />
            <DateItem label="Starts" value={formatDate(opp.start_date)} />
            <DateItem label="Ends" value={formatDate(opp.end_date)} />
          </dl>
          {!!opp.skills?.length && (
            <>
              <h2 className="mt-8 font-display text-2xl">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {opp.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </>
          )}
          <h2 className="mt-8 font-display text-2xl">Application process</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>Check the eligibility and deadline on this page.</li>
            <li>Open the official application link and submit there.</li>
            <li>Save the opportunity and track the status on your HOH board.</li>
          </ol>
          <button type="button" className="mt-6 text-sm text-muted-foreground underline" onClick={() => (user ? setReportOpen(true) : (window.location.href = "/login"))}>
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
      <section className="mt-10">
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
  return (
    <>
      <h2 className="mt-8 font-display text-2xl">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{body}</p>
    </>
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
