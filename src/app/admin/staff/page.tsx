"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { StaffMember } from "@/lib/types";

const roleColors: Record<string, string> = {
  admin: "bg-gold/20 text-gold",
  manager: "bg-accent text-ivory",
  kitchen: "bg-warning/20 text-warning",
  waiter: "bg-success/20 text-success",
  host: "bg-ivory-dim/20 text-ivory-dim",
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStaff(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Staff</h1>
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
            <Plus size={14} />
            Add Staff
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="bg-surface border border-border/50 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-ivory text-sm font-medium">{member.name}</p>
                  <p className="text-ivory-dim text-xs">{member.email}</p>
                </div>
                <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1", roleColors[member.role])}>
                  {member.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ivory-dim text-xs">{member.phone}</span>
                <span className="text-ivory-dim text-xs">{member.shift}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
