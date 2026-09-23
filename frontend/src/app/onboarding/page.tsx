"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EDUCATION_LEVELS, INTERESTS, LOCATION_OPTIONS, OPPORTUNITY_TYPES, SKILL_OPTIONS } from "@/lib/types";
import { cn, typeLabel } from "@/lib/utils";

const steps = ["Education", "Interests", "Skills", "Preferences", "Locations"];

function Wizard() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    university: user?.university ?? "",
    faculty: user?.faculty ?? "",
    department: user?.department ?? "",
    education_level: user?.education_level ?? "Bachelor",
    graduation_year: user?.graduation_year ?? new Date().getFullYear() + 1,
    interests: user?.interests ?? [],
    skills: user?.skills ?? [],
    preferred_categories: user?.preferred_categories ?? [],
    preferred_locations: user?.preferred_locations ?? [],
  });

  function toggle(key: "interests" | "skills" | "preferred_categories" | "preferred_locations", value: string) {
    setForm((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  async function finish() {
    setError("");
    try {
      const response = await api.post("/api/profile/onboarding", form);
      setUser(response.data);
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const ready =
    (step === 0 && form.university && form.faculty && form.department) ||
    (step === 1 && form.interests.length > 0) ||
    (step === 2 && form.skills.length > 0) ||
    (step === 3 && form.preferred_categories.length > 0) ||
    (step === 4 && form.preferred_locations.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-medium text-primary">Step {step + 1} of 5</p>
      <h1 className="mt-2 font-display text-4xl">{steps[step]}</h1>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${((step + 1) / 5) * 100}%` }} />
      </div>
      <div className="mt-6 rounded-[2rem] border border-border bg-card p-6">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="University"><Input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} /></Field>
            <Field label="Faculty"><Input value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Field>
            <Field label="Education level">
              <Select value={form.education_level} onChange={(event) => setForm({ ...form, education_level: event.target.value })}>
                {EDUCATION_LEVELS.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Graduation year">
              <Input type="number" value={form.graduation_year} onChange={(event) => setForm({ ...form, graduation_year: Number(event.target.value) })} />
            </Field>
          </div>
        )}
        {step === 1 && <Chips options={INTERESTS} selected={form.interests} onToggle={(value) => toggle("interests", value)} />}
        {step === 2 && <Chips options={SKILL_OPTIONS} selected={form.skills} onToggle={(value) => toggle("skills", value)} />}
        {step === 3 && <Chips options={OPPORTUNITY_TYPES} selected={form.preferred_categories} onToggle={(value) => toggle("preferred_categories", value)} label={typeLabel} />}
        {step === 4 && <Chips options={LOCATION_OPTIONS} selected={form.preferred_locations} onToggle={(value) => toggle("preferred_locations", value)} />}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</Button>
          {step < 4 ? (
            <Button type="button" disabled={!ready} onClick={() => setStep((value) => value + 1)}>Continue</Button>
          ) : (
            <Button type="button" disabled={!ready} onClick={() => void finish()}>Build My Opportunity Feed</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><Label>{label}</Label>{children}</label>;
}

function Chips({
  options,
  selected,
  onToggle,
  label,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  label?: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn("rounded-full border px-3 py-2 text-sm", active ? "border-primary bg-accent text-primary" : "border-border bg-card")}
          >
            {label ? label(option) : option}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <Wizard />
    </RequireAuth>
  );
}
