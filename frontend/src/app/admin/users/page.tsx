"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";
import { initials } from "@/lib/utils";

const roles = [
  ["STUDENT", "Student"],
  ["GRADUATE", "Graduate"],
  ["PROFESSIONAL", "Professional"],
  ["ADMIN", "Admin"],
] as const;

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const users = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await api.get<User[]>("/api/admin/users")).data });
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (users.data ?? []).filter((person) => !needle || `${person.full_name} ${person.email}`.toLowerCase().includes(needle));
  }, [query, users.data]);

  async function update(id: string, payload: { role?: string; is_verified?: boolean }) {
    try {
      await api.patch(`/api/admin/users/${id}`, payload);
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">People</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Users</h1>
      <p className="mt-2 text-sm text-muted-foreground">{users.data?.length ?? 0} accounts</p>
      <div className="mt-6">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search users" className="max-w-sm" />
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 space-y-3">
        {visible.map((person) => (
          <article key={person.id} className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-border bg-card px-4 py-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-sm font-semibold text-white">{initials(person.full_name)}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold">
                {person.full_name}
                {person.is_verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />}
                {person.id === user?.id && <span className="text-xs font-medium text-muted-foreground">You</span>}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{person.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">{[person.university, person.location].filter(Boolean).join(" · ") || "No university yet"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                className="w-40"
                value={person.role}
                aria-label={`Role for ${person.full_name}`}
                onChange={(event) => void update(person.id, { role: event.target.value })}
              >
                {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Button size="sm" variant="outline" onClick={() => void update(person.id, { is_verified: !person.is_verified })}>
                {person.is_verified ? "Unverify" : "Verify"}
              </Button>
              {person.id !== user?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${person.full_name}?`)) return;
                    try {
                      await api.delete(`/api/admin/users/${person.id}`);
                      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                    } catch (err) {
                      setError(errorMessage(err));
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </article>
        ))}
        {!users.isLoading && visible.length === 0 && <p className="text-sm text-muted-foreground">No accounts match that search.</p>}
      </div>
    </div>
  );
}
