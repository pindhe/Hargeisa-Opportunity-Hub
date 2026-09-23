"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { EDUCATION_LEVELS, OPPORTUNITY_TYPES, type Category, type Organization } from "@/lib/types";
import { typeLabel } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters"),
  short_description: z.string().min(10, "Add a short summary"),
  description: z.string().min(20, "Describe the opportunity"),
  organization_id: z.string().min(1, "Select an organization"),
  category_id: z.string().min(1, "Select a category"),
  opportunity_type: z.string().min(1, "Select a type"),
  location: z.string().min(2, "Add a location"),
  country: z.string().min(2, "Add a country"),
  is_remote: z.boolean(),
  deadline: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  eligibility: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  application_url: z.string().url("Enter a valid application URL"),
  image: z.string().optional(),
  tags: z.string().optional(),
  skills: z.string().optional(),
  featured: z.boolean(),
  status: z.string(),
});

export type OpportunityFormValues = z.infer<typeof schema>;

function split(value?: string) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function iso(value?: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

export function OpportunityForm({
  initial,
  levels,
  opportunityId,
}: {
  initial: OpportunityFormValues;
  levels: string[];
  opportunityId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [education, setEducation] = useState<string[]>(levels);
  const organizations = useQuery({ queryKey: ["admin-orgs"], queryFn: async () => (await api.get<Organization[]>("/api/admin/organizations")).data });
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await api.get<Category[]>("/api/admin/categories")).data });
  const form = useForm<OpportunityFormValues>({ resolver: zodResolver(schema), defaultValues: initial });

  return (
    <form
      className="grid gap-4 rounded-3xl border border-border bg-card p-5 md:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const payload = {
          ...values,
          deadline: iso(values.deadline),
          start_date: iso(values.start_date),
          end_date: iso(values.end_date),
          image: values.image || null,
          tags: split(values.tags),
          skills: split(values.skills),
          education_levels: education,
          eligibility: values.eligibility ?? "",
          requirements: values.requirements ?? "",
          benefits: values.benefits ?? "",
        };
        try {
          if (opportunityId) await api.patch(`/api/admin/opportunities/${opportunityId}`, payload);
          else await api.post("/api/admin/opportunities", payload);
          router.push("/admin/opportunities");
        } catch (err) {
          setError(errorMessage(err));
        }
      })}
    >
      <Field label="Title" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field>
      <Field label="Opportunity type" error={form.formState.errors.opportunity_type?.message}>
        <Select {...form.register("opportunity_type")}>{OPPORTUNITY_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</Select>
      </Field>
      <Field label="Short description" error={form.formState.errors.short_description?.message} className="md:col-span-2"><Textarea {...form.register("short_description")} /></Field>
      <Field label="Full description" error={form.formState.errors.description?.message} className="md:col-span-2"><Textarea {...form.register("description")} /></Field>
      <Field label="Organization" error={form.formState.errors.organization_id?.message}>
        <Select {...form.register("organization_id")}><option value="">Select</option>{(organizations.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      </Field>
      <Field label="Category" error={form.formState.errors.category_id?.message}>
        <Select {...form.register("category_id")}><option value="">Select</option>{(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      </Field>
      <Field label="Location" error={form.formState.errors.location?.message}><Input {...form.register("location")} /></Field>
      <Field label="Country" error={form.formState.errors.country?.message}><Input {...form.register("country")} /></Field>
      <Field label="Deadline"><Input type="date" {...form.register("deadline")} /></Field>
      <Field label="Start date"><Input type="date" {...form.register("start_date")} /></Field>
      <Field label="End date"><Input type="date" {...form.register("end_date")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_remote")} /> Remote</label>
      <Field label="Eligibility" className="md:col-span-2"><Textarea {...form.register("eligibility")} /></Field>
      <Field label="Requirements" className="md:col-span-2"><Textarea {...form.register("requirements")} /></Field>
      <Field label="Benefits" className="md:col-span-2"><Textarea {...form.register("benefits")} /></Field>
      <Field label="Application URL" error={form.formState.errors.application_url?.message} className="md:col-span-2"><Input {...form.register("application_url")} /></Field>
      <Field label="Image URL"><Input {...form.register("image")} /></Field>
      <Field label="Tags"><Input {...form.register("tags")} placeholder="AI, Paid" /></Field>
      <Field label="Skills" className="md:col-span-2"><Input {...form.register("skills")} placeholder="Python, React" /></Field>
      <div className="md:col-span-2">
        <p className="mb-2 text-sm font-medium">Education level</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {EDUCATION_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2">
              <input type="checkbox" checked={education.includes(level)} onChange={() => setEducation((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level])} />
              {level}
            </label>
          ))}
        </div>
      </div>
      <Field label="Status">
        <Select {...form.register("status")}>{["DRAFT", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((status) => <option key={status}>{status}</option>)}</Select>
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("featured")} /> Featured</label>
      {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting}>{opportunityId ? "Save changes" : "Publish opportunity"}</Button>
    </form>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export const emptyOpportunity: OpportunityFormValues = {
  title: "",
  short_description: "",
  description: "",
  organization_id: "",
  category_id: "",
  opportunity_type: "SCHOLARSHIP",
  location: "Hargeisa",
  country: "Somaliland",
  is_remote: false,
  deadline: "",
  start_date: "",
  end_date: "",
  eligibility: "",
  requirements: "",
  benefits: "",
  application_url: "https://",
  image: "",
  tags: "",
  skills: "",
  featured: false,
  status: "APPROVED",
};
