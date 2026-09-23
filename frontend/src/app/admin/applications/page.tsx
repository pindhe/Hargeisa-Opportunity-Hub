"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type Row = { id: string; status: string; user_name: string; user_email: string; opportunity_title: string; applied_at: string | null };

export default function AdminApplicationsPage() {
  const rows = useQuery({ queryKey: ["admin-apps"], queryFn: async () => (await api.get<Row[]>("/api/admin/applications")).data });
  return (
    <div>
      <h1 className="font-display text-4xl">Applications</h1>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr>{["User", "Opportunity", "Status", "Applied"].map((heading) => <th key={heading} className="px-3 py-3 font-medium text-muted-foreground">{heading}</th>)}</tr></thead>
          <tbody>
            {(rows.data ?? []).map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-3">{row.user_name}<div className="text-xs text-muted-foreground">{row.user_email}</div></td>
                <td className="px-3 py-3">{row.opportunity_title}</td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3">{formatDate(row.applied_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
