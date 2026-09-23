"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { OrgMark } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import type { Organization } from "@/lib/types";

const blank = { name: "", description: "", website: "", email: "", phone: "", location: "Hargeisa", logo: "", verified: true };

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const orgs = useQuery({ queryKey: ["admin-orgs"], queryFn: async () => (await api.get<Organization[]>("/api/admin/organizations")).data });
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (orgs.data ?? []).filter((org) => !needle || `${org.name} ${org.location ?? ""}`.toLowerCase().includes(needle));
  }, [orgs.data, query]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
        logo: form.logo.trim() || null,
        verified: form.verified,
      };
      if (editing) return api.patch(`/api/admin/organizations/${editing}`, payload);
      return api.post("/api/admin/organizations", payload);
    },
    onSuccess: () => {
      setForm(blank);
      setEditing(null);
      setOpen(false);
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function startEdit(org: Organization) {
    setEditing(org.id);
    setOpen(true);
    setError("");
    setForm({
      name: org.name,
      description: org.description,
      website: org.website ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      location: org.location ?? "",
      logo: org.logo ?? "",
      verified: org.verified,
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Catalogue</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Organizations</h1>
          <p className="mt-2 text-sm text-muted-foreground">{orgs.data?.length ?? 0} organizations on the catalogue</p>
        </div>
        <Button
          onClick={() => {
            setOpen((value) => !value);
            setEditing(null);
            setForm(blank);
            setError("");
          }}
        >
          {open && !editing ? "Close" : "Add organization"}
        </Button>
      </div>

      {open && (
        <form
          className="mt-6 grid gap-3 rounded-[1.4rem] border border-border bg-card p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            save.mutate();
          }}
        >
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl">{editing ? "Edit organization" : "New organization"}</h2>
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <div>
            <Label>Logo</Label>
            <Input value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} placeholder="/orgs/name.png or https://" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} />
            Verified
          </label>
          {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={save.isPending}>{editing ? "Save changes" : "Add organization"}</Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(blank); setOpen(false); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations" aria-label="Search organizations" className="max-w-sm" />
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((org) => (
          <article key={org.id} className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-border bg-card px-4 py-4">
            <OrgMark name={org.name} logo={org.logo} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold">
                {org.name}
                {org.verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{org.location || "No location"}</span>
                <span>{org.opportunity_count} listings</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/organizations/${org.slug}`}>View</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => startEdit(org)}>Edit</Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                onClick={async () => {
                  if (!window.confirm(`Delete ${org.name}?`)) return;
                  try {
                    await api.delete(`/api/admin/organizations/${org.id}`);
                    void queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
        {!orgs.isLoading && visible.length === 0 && <p className="text-sm text-muted-foreground">No organizations match that search.</p>}
      </div>
      {error && !open && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
