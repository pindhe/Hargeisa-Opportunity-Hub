"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Button, Input, Select, Textarea } from "@/components/ui";

export default function ProfilePage() {
  const { token, user, loading, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Partial<User> & Record<string, unknown>>({});
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setForm(user);
      setSkills((user.skills ?? []).join(", "));
      setInterests((user.interests ?? []).join(", "));
    }
  }, [user]);

  if (!user) return <div className="mx-auto max-w-3xl px-4 py-16"><div className="h-96 animate-pulse rounded-3xl bg-white" /></div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    await api("/api/profile", {
      method: "PUT",
      token,
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        location: form.location,
        educationLevel: form.profile?.educationLevel,
        university: form.profile?.university,
        degree: form.profile?.degree,
        field: form.profile?.field,
        graduationYear: form.profile?.graduationYear ? Number(form.profile.graduationYear) : undefined,
        gpa: form.profile?.gpa,
        careerGoals: form.profile?.careerGoals,
        preferredLocations: form.profile?.preferredLocations,
        preferredCategories: form.profile?.preferredCategories,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
        emailNotifications: form.profile?.emailNotifications,
        inAppNotifications: form.profile?.inAppNotifications,
        browserNotifications: form.profile?.browserNotifications,
        deadlineReminders: form.profile?.deadlineReminders,
      }),
    });
    await refresh();
    setSaved("Profile saved.");
    setBusy(false);
  }

  const p = form.profile ?? {};

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Your profile</h1>
      <p className="mt-2 text-sm text-slate-600">Profile completeness: {user.completeness ?? 0}%</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-3xl bg-white p-6 md:p-8">
        <h2 className="font-semibold text-navy">Personal information</h2>
        <Input value={String(form.name ?? "")} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        <Input value={user.email} disabled />
        <Input value={String(form.phone ?? "")} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
        <Select value={String(form.location ?? "")} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          <option value="">Location</option>
          <option value="hargeisa">Hargeisa</option>
          <option value="somaliland">Somaliland</option>
          <option value="remote">Remote</option>
        </Select>

        <h2 className="font-semibold text-navy">Education</h2>
        <Select value={p.educationLevel ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, educationLevel: e.target.value } })}>
          <option value="">Education level</option>
          <option value="high_school">High School</option>
          <option value="diploma">Diploma</option>
          <option value="bachelors">Bachelor's</option>
          <option value="masters">Master's</option>
          <option value="phd">PhD</option>
        </Select>
        <Input value={p.university ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, university: e.target.value } })} placeholder="University" />
        <Input value={p.degree ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, degree: e.target.value } })} placeholder="Degree" />
        <Input value={p.field ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, field: e.target.value } })} placeholder="Field of study" />
        <Input value={p.gpa ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, gpa: e.target.value } })} placeholder="GPA (optional)" />
        <Textarea value={p.careerGoals ?? ""} onChange={(e) => setForm({ ...form, profile: { ...p, careerGoals: e.target.value } })} placeholder="Career goals" rows={4} />

        <h2 className="font-semibold text-navy">Skills and interests</h2>
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, comma separated" />
        <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Interests, comma separated" />

        <h2 className="font-semibold text-navy">Notification preferences</h2>
        {[
          ["emailNotifications", "Email notifications"],
          ["inAppNotifications", "In-app notifications"],
          ["browserNotifications", "Browser notifications"],
          ["deadlineReminders", "Deadline reminders"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean((p as Record<string, unknown>)[key] ?? true)}
              onChange={(e) => setForm({ ...form, profile: { ...p, [key]: e.target.checked } })}
            />
            {label}
          </label>
        ))}
        <Button disabled={busy}>{busy ? "Saving..." : "Save profile"}</Button>
        {saved ? <p className="text-sm text-emerald-700">{saved}</p> : null}
      </form>
    </div>
  );
}
