"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import type { Organization } from "@/lib/types";

const blank = { name: "", description: "", website: "", email: "", phone: "", location: "Hargeisa", verified: true };

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const orgs = useQuery({ queryKey: ["admin-orgs"], queryFn: async () => (await api.get<Organization[]>("/api/admin/organizations")).data });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, website: form.website || null, logo: null };
      if (editing) return api.patch(`/api/admin/organizations/${editing}`, payload);
      return api.post("/api/admin/organizations", payload);
    },
    onSuccess: () => {
      setForm(blank);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Organizations</h1>
      <form className="mt-4 grid gap-3 rounded-3xl border border-border bg-white p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setError(""); save.mutate(); }}>
        {(["name", "website", "email", "phone", "location"] as const).map((field) => (
          <div key={field}><Label>{field}</Label><Input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></div>
        ))}
        <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} /> Verified</label>
        {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
        <Button type="submit">{editing ? "Update" : "Add organization"}</Button>
      </form>
      <div className="mt-4 space-y-2">
        {(orgs.data ?? []).map((org) => (
          <div key={org.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 py-3">
            <div><p className="font-medium">{org.name}</p><p className="text-sm text-muted-foreground">{org.location} · {org.opportunity_count} opportunities</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(org.id); setForm({ name: org.name, description: org.description, website: org.website ?? "", email: org.email ?? "", phone: org.phone ?? "", location: org.location ?? "", verified: org.verified }); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await api.delete(`/api/admin/organizations/${org.id}`); void queryClient.invalidateQueries({ queryKey: ["admin-orgs"] }); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
