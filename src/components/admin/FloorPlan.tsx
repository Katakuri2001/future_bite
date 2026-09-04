"use client";

import { cn } from "@/lib/utils";
import { floorPlanTables } from "@/lib/data";
import type { FloorPlanTable } from "@/lib/types";

const statusColors: Record<string, string> = {
  available: "bg-success/20 border-success text-success",
  reserved: "bg-warning/20 border-warning text-warning",
  seated: "bg-gold/20 border-gold text-gold",
  waiting: "bg-error/20 border-error text-error",
  cleaning: "bg-ivory-dim/20 border-ivory-dim text-ivory-dim",
};

const statusLabels: Record<string, string> = {
  available: "AVAILABLE",
  reserved: "RESERVED",
  seated: "SEATED",
  waiting: "WAITING",
  cleaning: "CLEANING",
};

function TableTile({ table }: { table: FloorPlanTable }) {
  return (
    <button
      className={cn(
        "absolute border-2 p-2 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105 hover:z-10 cursor-pointer",
        statusColors[table.status]
      )}
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: `${table.width}px`,
        height: `${table.height}px`,
      }}
      aria-label={`Table ${table.number}, ${statusLabels[table.status]}`}
    >
      <span className="text-ivory font-mono text-sm font-bold">
        {table.number}
      </span>
      <span className="text-ivory-dim text-[9px] uppercase">
        {table.capacity} seats
      </span>
      <span
        className={cn(
          "text-[8px] uppercase tracking-wider font-medium mt-1",
          statusColors[table.status].split(" ").pop()
        )}
      >
        {statusLabels[table.status]}
      </span>
      {table.currentReservation && (
        <span className="text-ivory-dim text-[8px] mt-0.5">
          {table.currentReservation.guestName}
        </span>
      )}
    </button>
  );
}

export default function FloorPlan() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ivory">Floor Plan</h1>
        <div className="flex gap-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-2.5 h-2.5 border",
                  statusColors[status].split(" ").slice(0, 2).join(" ")
                )}
              />
              <span className="text-ivory-dim text-[10px] uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border/50 p-6 relative min-h-[500px]">
        {/* Restaurant outline */}
        <div className="absolute inset-4 border border-border/30 rounded-sm">
          <span className="absolute top-2 left-3 text-ivory-dim text-[10px] uppercase tracking-wider">
            Main Dining
          </span>
          <span className="absolute bottom-2 right-3 text-ivory-dim text-[10px] uppercase tracking-wider">
            Bar Area
          </span>
          <span className="absolute top-2 right-3 text-ivory-dim text-[10px] uppercase tracking-wider">
            Private Room
          </span>
        </div>

        {floorPlanTables.map((table) => (
          <TableTile key={table.id} table={table} />
        ))}
      </div>

      {/* Table details */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {floorPlanTables.map((table) => (
          <div
            key={table.id}
            className="bg-surface border border-border/50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-ivory font-mono text-sm font-bold">
                #{table.number}
              </span>
              <span
                className={cn(
                  "text-[9px] uppercase tracking-wider px-1.5 py-0.5 border",
                  statusColors[table.status]
                )}
              >
                {statusLabels[table.status]}
              </span>
            </div>
            <p className="text-ivory-dim text-xs">
              {table.capacity} seats · {table.experience}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
