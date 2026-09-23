"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Report = { id: string; reason: string; description: string; status: string; user_name: string; opportunity_title: string };

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const reports = useQuery({ queryKey: ["reports"], queryFn: async () => (await api.get<Report[]>("/api/admin/reports")).data });
  return (
    <div>
      <h1 className="font-display text-4xl">Reports</h1>
      <div className="mt-4 space-y-3">
        {(reports.data ?? []).map((report) => (
          <article key={report.id} className="rounded-3xl border border-border bg-card p-4">
            <p className="font-semibold">{report.opportunity_title}</p>
            <p className="text-sm text-muted-foreground">{report.user_name} · {report.reason} · {report.status}</p>
            <p className="mt-2 text-sm">{report.description || "No extra detail."}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => { await api.patch(`/api/admin/reports/${report.id}`, null, { params: { status: "REVIEWED" } }); void queryClient.invalidateQueries({ queryKey: ["reports"] }); }}>Reviewed</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await api.patch(`/api/admin/reports/${report.id}`, null, { params: { status: "DISMISSED" } }); void queryClient.invalidateQueries({ queryKey: ["reports"] }); }}>Dismiss</Button>
            </div>
          </article>
        ))}
        {reports.data?.length === 0 && <p className="text-sm text-muted-foreground">No reports.</p>}
      </div>
    </div>
  );
}
