"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { RequireAuth } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Application, Opportunity } from "@/lib/types";
import { initials, mediaUrl } from "@/lib/utils";

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

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-[2rem] border border-border bg-white p-6">
        {user.profile_image ? (
          <img src={mediaUrl(user.profile_image)} alt="" className="h-20 w-20 rounded-3xl object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-ink text-xl text-white">{initials(user.full_name)}</div>
        )}
        <div>
          <h1 className="font-display text-4xl">{user.full_name}</h1>
          <p className="text-muted-foreground">{user.university || "Add your university"} · {user.department || "Department"}</p>
          <p className="text-sm text-primary">@{user.username}</p>
        </div>
        <Button className="ml-auto" variant="outline" onClick={() => setEditing((value) => !value)}>Edit profile</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Saved" value={saved.data?.length ?? 0} />
        <Stat label="Tracking" value={applications.data?.length ?? 0} />
        <Stat label="Applied or beyond" value={applied} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ChipBlock title="Skills" items={user.skills} />
        <ChipBlock title="Interests" items={user.interests} />
      </div>
      <div className="mt-4 rounded-3xl border border-border bg-white p-5 text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">Education</p>
        <p className="mt-2">{[user.education_level, user.faculty, user.department, user.graduation_year].filter(Boolean).join(" · ") || "Not added yet."}</p>
        {user.bio && <p className="mt-3">{user.bio}</p>}
      </div>
      {editing && (
        <form
          className="mt-4 grid gap-3 rounded-3xl border border-border bg-white p-5 sm:grid-cols-2"
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
          {(["full_name", "phone", "location", "university", "faculty", "department", "education_level"] as const).map((field) => (
            <div key={field}>
              <Label>{field.replaceAll("_", " ")}</Label>
              <Input {...form.register(field)} />
            </div>
          ))}
          <div>
            <Label>Graduation year</Label>
            <Input type="number" {...form.register("graduation_year")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Skills, comma separated</Label>
            <Input {...form.register("skills")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Interests, comma separated</Label>
            <Input {...form.register("interests")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <Textarea {...form.register("bio")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Profile photo</Label>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const body = new FormData();
                body.append("file", file);
                const response = await api.post("/api/profile/avatar", body);
                setUser(response.data);
                toast.push("Photo updated.");
              }}
            />
          </div>
          <Button type="submit">Save changes</Button>
          <Link href={`/users/${user.username}`} className="self-center text-sm text-primary">View public profile</Link>
        </form>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-border bg-white p-4"><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>;
}

function ChipBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
        {items.map((item) => <span key={item} className="rounded-full bg-accent px-3 py-1 text-sm text-primary">{item}</span>)}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <RequireAuth><Profile /></RequireAuth>;
}
