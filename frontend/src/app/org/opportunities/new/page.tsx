"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Input, Select, Textarea } from "@/components/ui";

export default function NewOpportunityPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "internship",
    description: "",
    requirements: "",
    benefits: "",
    applicationProcess: "",
    location: "hargeisa",
    opportunityType: "offline",
    fundingType: "paid",
    educationLevel: "bachelors",
    field: "Software Engineering",
    deadline: "2026-10-15T23:59:00.000Z",
    applicationUrl: "https://example.org/apply",
    applicationMode: "external",
  });

  useEffect(() => {
    if (!loading && (!user || (user.role !== "organization" && user.role !== "admin"))) router.push("/login");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    try {
      await api("/api/opportunities", { method: "POST", token, body: JSON.stringify(form) });
      router.push("/org/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit opportunity.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Submit an opportunity</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-3xl bg-white p-6">
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
        <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {["scholarship", "job", "internship", "course", "training", "competition", "hackathon"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" required />
        <Textarea rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Requirements" />
        <Textarea rows={3} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="Benefits" />
        <Textarea rows={3} value={form.applicationProcess} onChange={(e) => setForm({ ...form, applicationProcess: e.target.value })} placeholder="Application process" />
        <Select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          {["hargeisa", "somaliland", "somalia", "africa", "international", "remote"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={form.opportunityType} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </Select>
        <Select value={form.fundingType} onChange={(e) => setForm({ ...form, fundingType: e.target.value })}>
          {["fully_funded", "partially_funded", "paid", "free", "unpaid"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}>
          {["high_school", "diploma", "bachelors", "masters", "phd"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} placeholder="Field" />
        <label className="block text-sm">Deadline
          <Input className="mt-1" type="datetime-local" onChange={(e) => setForm({ ...form, deadline: new Date(e.target.value).toISOString() })} />
        </label>
        <Input value={form.applicationUrl} onChange={(e) => setForm({ ...form, applicationUrl: e.target.value })} placeholder="Official application URL" />
        <Button>Submit for review</Button>
      </form>
    </div>
  );
}
