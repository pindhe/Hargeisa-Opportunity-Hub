"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "", icon: "Sparkles", color: "#0C6B58" });
  const [editing, setEditing] = useState<string | null>(null);
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await api.get<Category[]>("/api/admin/categories")).data });
  const save = useMutation({
    mutationFn: async () => (editing ? api.patch(`/api/admin/categories/${editing}`, form) : api.post("/api/admin/categories", form)),
    onSuccess: () => {
      setEditing(null);
      setForm({ name: "", description: "", icon: "Sparkles", color: "#0C6B58" });
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Categories</h1>
      <form className="mt-4 grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <div><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
        <div><Label>Icon</Label><Input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} /></div>
        <div><Label>Color</Label><Input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div>
        <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
        <Button type="submit">{editing ? "Update category" : "Add category"}</Button>
      </form>
      <div className="mt-4 space-y-2">
        {(categories.data ?? []).map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <div><p className="font-medium">{category.name}</p><p className="text-sm text-muted-foreground">{category.opportunity_count} opportunities</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(category.id); setForm({ name: category.name, description: category.description, icon: category.icon, color: category.color }); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await api.delete(`/api/admin/categories/${category.id}`); void queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
