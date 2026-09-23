"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { initials, mediaUrl } from "@/lib/utils";

export function PublicProfile({ username }: { username: string }) {
  const profile = useQuery({
    queryKey: ["public-user", username],
    queryFn: async () => (await api.get<PublicUser>(`/api/users/${username}`)).data,
  });
  const user = profile.data;
  if (profile.isLoading) return <p className="px-4 py-16 text-sm text-muted-foreground">Loading profile…</p>;
  if (!user) return <p className="px-4 py-16">This profile is not available.</p>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {user.profile_image ? <img src={mediaUrl(user.profile_image)} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-white">{initials(user.full_name)}</div>}
          <div>
            <h1 className="font-display text-4xl">{user.full_name}</h1>
            <p className="text-muted-foreground">{user.university} · {user.department}</p>
          </div>
        </div>
        {user.bio && <p className="mt-4 text-sm leading-6 text-muted-foreground">{user.bio}</p>}
        <p className="mt-4 text-sm">{[user.education_level, user.faculty, user.graduation_year, user.location].filter(Boolean).join(" · ")}</p>
        <div className="mt-4 flex flex-wrap gap-2">{user.skills.map((skill) => <span key={skill} className="rounded-full bg-accent px-3 py-1 text-sm">{skill}</span>)}</div>
        <div className="mt-3 flex flex-wrap gap-2">{user.interests.map((item) => <span key={item} className="rounded-full border border-border px-3 py-1 text-sm">{item}</span>)}</div>
      </div>
    </div>
  );
}
