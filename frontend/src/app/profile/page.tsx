"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Bookmark, GraduationCap, MapPin, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { RequireAuth } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Application, Opportunity } from "@/lib/types";
import { initials, mediaUrl, statusLabel } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Enter your name"),
  phone: z.string().optional(),
  location: z.string().optional(),
  university: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  graduation_year: z.coerce.number().min(1990).max(2040).optional().or(z.nan()),
  education_level: z.string().optional(),
  bio: z.string().max(1000).optional(),
  skills: z.string().optional(),
  interests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fields = [
  ["full_name", "Full name"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["university", "University"],
  ["faculty", "Faculty"],
  ["department", "Department"],
  ["education_level", "Education level"],
] as const;

const roles: Record<string, string> = {
  STUDENT: "Student",
  GRADUATE: "Graduate",
  PROFESSIONAL: "Professional",
  ADMIN: "Admin",
};

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saved = useQuery({ queryKey: ["bookmarks"], queryFn: async () => (await api.get<Opportunity[]>("/api/bookmarks")).data });
  const applications = useQuery({ queryKey: ["applications"], queryFn: async () => (await api.get<Application[]>("/api/applications")).data });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      location: user?.location ?? "",
      university: user?.university ?? "",
      faculty: user?.faculty ?? "",
      department: user?.department ?? "",
      graduation_year: user?.graduation_year ?? undefined,
      education_level: user?.education_level ?? "",
      bio: user?.bio ?? "",
      skills: (user?.skills ?? []).join(", "),
      interests: (user?.interests ?? []).join(", "),
    },
  });

  if (!user) return null;
  const applied = (applications.data ?? []).filter((item) => ["APPLIED", "INTERVIEW", "ACCEPTED"].includes(item.status)).length;
  const education = [user.education_level, user.faculty, user.department, user.graduation_year].filter(Boolean).join(" · ");

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await api.post("/api/profile/avatar", body);
      setUser(response.data);
      toast.push("Photo updated.");
    } catch (error) {
      toast.push(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[1.8rem] border border-border bg-card px-5 py-6 shadow-[0_18px_40px_-32px_rgba(7,21,16,0.55)] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
          <label className="relative h-24 w-24 shrink-0 cursor-pointer sm:h-28 sm:w-28" aria-label="Change profile photo">
            {user.profile_image ? (
              <img src={mediaUrl(user.profile_image)} alt="" className="h-full w-full rounded-[1.4rem] object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center rounded-[1.4rem] bg-ink text-2xl font-semibold text-white">{initials(user.full_name)}</span>
            )}
            <span className="absolute right-1 bottom-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm">
              <CameraIcon />
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadPhoto(file);
              }}
            />
          </label>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl leading-tight sm:text-4xl">{user.full_name}</h1>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">{roles[user.role] ?? user.role}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Button variant="outline" onClick={() => setEditing((value) => !value)}>{editing ? "Close editor" : "Edit profile"}</Button>
              <Button asChild variant="secondary">
                <Link href={`/users/${user.username}`}>Public profile</Link>
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" />{user.email}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{user.location || "Location not added"}</span>
            <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" />{[user.university, user.department].filter(Boolean).join(" · ") || "University not added"}</span>
          </div>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat href="/dashboard/saved" label="Saved" value={saved.data?.length ?? 0} />
          <Stat href="/dashboard/applications" label="Tracking" value={applications.data?.length ?? 0} />
          <Stat href="/dashboard/applications" label="Applied or beyond" value={applied} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <section className="rounded-[1.6rem] border border-border bg-card p-6">
              <h2 className="font-display text-2xl">About</h2>
              <p className="mt-3 max-w-2xl text-base leading-8 text-foreground/85">{user.bio || "Add a short note about what you study and the work you want next."}</p>
            </section>
            <section className="rounded-[1.6rem] border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Education</h2>
              <p className="mt-3 text-base leading-8">{education || "Add your faculty, department, and graduation year."}</p>
              {user.phone && <p className="mt-2 text-sm text-muted-foreground">{user.phone}</p>}
            </section>
            <section className="rounded-[1.6rem] border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Applications</h2>
                <Link href="/dashboard/applications" className="text-sm font-semibold text-primary">Open tracker</Link>
              </div>
              <div className="mt-4 space-y-2">
                {(applications.data ?? []).slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/opportunities/${item.opportunity.slug}`} className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
                    <span className="font-medium">{item.opportunity.title}</span>
                    <span className="shrink-0 text-sm text-primary">{statusLabel(item.status)}</span>
                  </Link>
                ))}
                {applications.data?.length === 0 && <p className="text-sm text-muted-foreground">Nothing tracked yet. Open a listing and add it to your board.</p>}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <ChipBlock title="Skills" items={user.skills} />
            <ChipBlock title="Interests" items={user.interests} />
            <section className="rounded-[1.6rem] border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Saved</h2>
                <Link href="/dashboard/saved" className="text-sm font-semibold text-primary">See all</Link>
              </div>
              <div className="mt-4 space-y-2">
                {(saved.data ?? []).slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/opportunities/${item.slug}`} className="flex items-center gap-2 rounded-2xl px-1 py-2 text-sm hover:text-primary">
                    <Bookmark className="h-4 w-4 shrink-0 text-primary" />
                    <span className="line-clamp-1">{item.title}</span>
                  </Link>
                ))}
                {saved.data?.length === 0 && <p className="text-sm text-muted-foreground">Save a listing from its page to keep it here.</p>}
              </div>
            </section>
          </div>
        </div>

        {editing && (
          <form
            className="mt-6 grid gap-4 rounded-[1.6rem] border border-border bg-card p-6 sm:grid-cols-2"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const response = await api.patch("/api/profile", {
                  ...values,
                  graduation_year: Number.isFinite(values.graduation_year) ? values.graduation_year : null,
                  skills: (values.skills ?? "").split(",").map((item) => item.trim()).filter(Boolean),
                  interests: (values.interests ?? "").split(",").map((item) => item.trim()).filter(Boolean),
                });
                setUser(response.data);
                toast.push("Profile updated.");
                setEditing(false);
              } catch (error) {
                toast.push(errorMessage(error));
              }
            })}
          >
            <div className="sm:col-span-2">
              <h2 className="font-display text-2xl">Edit profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">These details are what recommendations and your public page use.</p>
            </div>
            {fields.map(([field, label]) => (
              <div key={field}>
                <Label>{label}</Label>
                <Input {...form.register(field)} />
              </div>
            ))}
            <div>
              <Label>Graduation year</Label>
              <Input type="number" {...form.register("graduation_year")} />
            </div>
            <div className="sm:col-span-2">
              <Label>Skills</Label>
              <Input {...form.register("skills")} placeholder="Python, React, research" />
            </div>
            <div className="sm:col-span-2">
              <Label>Interests</Label>
              <Input {...form.register("interests")} placeholder="Scholarships, internships" />
            </div>
            <div className="sm:col-span-2">
              <Label>About</Label>
              <Textarea {...form.register("bio")} placeholder="What you study and the kind of opportunity you want." />
            </div>
            <div className="sm:col-span-2">
              <Label>Profile photo</Label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-[1.6rem] border border-border bg-card p-5 transition hover:-translate-y-0.5">
      <p className="font-display text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

function ChipBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[1.6rem] border border-border bg-card p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
        {items.map((item) => (
          <span key={item} className="rounded-full bg-accent px-3 py-1 text-sm text-primary">{item}</span>
        ))}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return <RequireAuth><Profile /></RequireAuth>;
}
