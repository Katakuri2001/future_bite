"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";
import { reservations } from "@/lib/data";

const statusColors: Record<string, string> = {
  confirmed: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning",
  seated: "bg-gold/20 text-gold",
  cancelled: "bg-error/20 text-error",
  "no-show": "bg-ivory-dim/20 text-ivory-dim",
  completed: "bg-ivory-dim/20 text-ivory-dim",
};

export default function AdminReservationsPage() {
  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Reservations</h1>
          <button className="btn-primary text-xs py-2 px-4">New Reservation</button>
        </div>

        <div className="bg-surface border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Guest
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Date & Time
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Party
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Table
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Experience
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr
                    key={res.id}
                    className="border-b border-border/30 hover:bg-surface-elevated transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-ivory text-sm">{res.customerName}</p>
                      <p className="text-ivory-dim text-xs">{res.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ivory text-sm">
                        {new Date(res.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-ivory-dim text-xs">{res.time}</p>
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">{res.partySize}</td>
                    <td className="px-4 py-3 text-ivory text-sm">{res.tableNumber}</td>
                    <td className="px-4 py-3 text-ivory text-sm capitalize">
                      {res.experience}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider px-2 py-1 inline-block",
                          statusColors[res.status]
                        )}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-xs font-mono">
                      {res.confirmationCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
