"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/types";

const blank = { name: "", description: "", icon: "Sparkles", color: "#0C6B58" };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await api.get<Category[]>("/api/admin/categories")).data });
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (categories.data ?? []).filter((item) => !needle || item.name.toLowerCase().includes(needle));
  }, [categories.data, query]);

  const save = useMutation({
    mutationFn: async () => (editing ? api.patch(`/api/admin/categories/${editing}`, form) : api.post("/api/admin/categories", form)),
    onSuccess: () => {
      setEditing(null);
      setForm(blank);
      setOpen(false);
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function startEdit(category: Category) {
    setEditing(category.id);
    setOpen(true);
    setError("");
    setForm({ name: category.name, description: category.description, icon: category.icon, color: category.color });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Catalogue</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Categories</h1>
          <p className="mt-2 text-sm text-muted-foreground">{categories.data?.length ?? 0} categories</p>
        </div>
        <Button onClick={() => { setOpen((value) => !value); setEditing(null); setForm(blank); setError(""); }}>
          {open && !editing ? "Close" : "Add category"}
        </Button>
      </div>

      {open && (
        <form
          className="mt-6 grid gap-3 rounded-[1.4rem] border border-border bg-card p-5 md:grid-cols-2"
          onSubmit={(event) => { event.preventDefault(); setError(""); save.mutate(); }}
        >
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl">{editing ? "Edit category" : "New category"}</h2>
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div>
            <Label>Icon</Label>
            <Input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-card" aria-label="Category color" />
              <Input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>{editing ? "Save changes" : "Add category"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(blank); setOpen(false); }}>Cancel</Button>}
          </div>
        </form>
      )}

      <div className="mt-6">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories" aria-label="Search categories" className="max-w-sm" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((category) => (
          <article key={category.id} className="rounded-[1.4rem] border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${category.color}22`, color: category.color }}>
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{category.name}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{category.description || "No description yet."}</p>
                <p className="mt-2 text-sm text-muted-foreground">{category.opportunity_count} listings</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(category)}>Edit</Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                onClick={async () => {
                  if (!window.confirm(`Delete ${category.name}?`)) return;
                  try {
                    await api.delete(`/api/admin/categories/${category.id}`);
                    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
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
      </div>
      {!categories.isLoading && visible.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No categories match that search.</p>}
      {error && !open && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
