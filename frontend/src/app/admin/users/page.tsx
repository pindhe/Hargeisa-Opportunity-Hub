"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await api.get<User[]>("/api/admin/users")).data });
  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr>{["Name", "Email", "Role", "Verified", ""].map((heading) => <th key={heading} className="px-3 py-3 font-medium text-muted-foreground">{heading}</th>)}</tr></thead>
          <tbody>
            {(users.data ?? []).map((person) => (
              <tr key={person.id} className="border-t border-border">
                <td className="px-3 py-3">{person.full_name}</td>
                <td className="px-3 py-3">{person.email}</td>
                <td className="px-3 py-3">
                  <Select value={person.role} onChange={async (event) => { await api.patch(`/api/admin/users/${person.id}`, { role: event.target.value }); void queryClient.invalidateQueries({ queryKey: ["admin-users"] }); }}>
                    {["STUDENT", "GRADUATE", "PROFESSIONAL", "ADMIN"].map((role) => <option key={role}>{role}</option>)}
                  </Select>
                </td>
                <td className="px-3 py-3">{person.is_verified ? "Yes" : "No"}</td>
                <td className="px-3 py-3">
                  {person.id !== user?.id && <Button size="sm" variant="ghost" onClick={async () => { if (window.confirm("Delete this user?")) { await api.delete(`/api/admin/users/${person.id}`); void queryClient.invalidateQueries({ queryKey: ["admin-users"] }); } }}>Delete</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
