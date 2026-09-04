"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";
import { inventoryItems } from "@/lib/data";
import { Plus, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  healthy: "bg-success/20 text-success",
  low: "bg-warning/20 text-warning",
  critical: "bg-error/20 text-error",
};

export default function AdminInventoryPage() {
  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Inventory</h1>
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
            <Plus size={14} />
            Add Item
          </button>
        </div>

        {/* Alert banner */}
        {inventoryItems.some((i) => i.status === "critical") && (
          <div className="bg-error/10 border border-error/30 p-4 mb-6 flex items-center gap-3">
            <AlertTriangle size={16} className="text-error" />
            <p className="text-error text-sm">
              {inventoryItems.filter((i) => i.status === "critical").length} item(s)
              are critically low and need immediate attention.
            </p>
          </div>
        )}

        <div className="bg-surface border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Item
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Stock
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Min. Stock
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Cost
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Supplier
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/30 hover:bg-surface-elevated transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-ivory text-sm">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-sm">
                      {item.minimumStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">
                      ${item.cost}/{item.unit}
                    </td>
                    <td className="px-4 py-3 text-ivory-muted text-sm">
                      {item.supplier}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider px-2 py-1 inline-block",
                          statusColors[item.status]
                        )}
                      >
                        {item.status}
                      </span>
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
