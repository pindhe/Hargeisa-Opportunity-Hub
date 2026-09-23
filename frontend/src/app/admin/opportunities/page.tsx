"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { formatDate, typeLabel } from "@/lib/utils";

export default function AdminOpportunitiesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: ["admin-opps", q, status, page],
    queryFn: async () => (await api.get<PageResult>("/api/admin/opportunities", { params: { q, status: status || undefined, page, page_size: 8 } })).data,
  });
  const act = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      if (action === "delete") return api.delete(`/api/admin/opportunities/${id}`);
      return api.post(`/api/admin/opportunities/${id}/${action}`);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-opps"] }),
  });
  const totalPages = Math.max(1, Math.ceil((result.data?.total ?? 0) / 8));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Opportunities</h1>
        <Button asChild><Link href="/admin/opportunities/create">Add opportunity</Link></Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Search" aria-label="Search" />
        <Select className="max-w-xs" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Status">
          <option value="">All statuses</option>
          {["DRAFT", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((item) => <option key={item}>{item}</option>)}
        </Select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>{["Title", "Organization", "Category", "Deadline", "Status", "Views", "Created", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {(result.data?.items ?? []).map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{item.title}</td>
                <td className="px-3 py-3">{item.organization.name}</td>
                <td className="px-3 py-3">{item.category.name}<div className="text-xs text-muted-foreground">{typeLabel(item.opportunity_type)}</div></td>
                <td className="px-3 py-3">{formatDate(item.deadline)}</td>
                <td className="px-3 py-3">{item.status}</td>
                <td className="px-3 py-3">{item.views}</td>
                <td className="px-3 py-3">{formatDate(item.created_at)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Link className="text-primary" href={`/admin/opportunities/${item.id}/edit`}>Edit</Link>
                    <button type="button" className="text-primary" onClick={() => act.mutate({ id: item.id, action: "approve" })}>Approve</button>
                    <button type="button" className="text-primary" onClick={() => act.mutate({ id: item.id, action: "reject" })}>Reject</button>
                    <button type="button" className="text-primary" onClick={() => act.mutate({ id: item.id, action: "feature" })}>{item.featured ? "Unfeature" : "Feature"}</button>
                    <button type="button" className="text-danger" onClick={() => { if (window.confirm("Delete this opportunity?")) act.mutate({ id: item.id, action: "delete" }); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>
    </div>
  );
}
