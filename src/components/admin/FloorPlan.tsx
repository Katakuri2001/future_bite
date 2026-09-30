"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { FloorPlanTable, TableExperience, TableStatus } from "@/lib/types";

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

const experiences: TableExperience[] = [
  "main",
  "window",
  "bar",
  "private",
  "patio",
];
const statuses: TableStatus[] = [
  "available",
  "reserved",
  "seated",
  "waiting",
  "cleaning",
];

function TableTile({
  table,
  onEdit,
  onDelete,
}: {
  table: FloorPlanTable;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute border-2 p-2 flex flex-col items-center justify-center text-center transition-all duration-200 group",
        statusColors[table.status]
      )}
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: `${table.width}px`,
        height: `${table.height}px`,
      }}
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
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-bg/70 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 bg-gold text-bg hover:bg-gold-muted transition-colors"
          aria-label={`Edit table ${table.number}`}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-error text-ivory hover:bg-error/80 transition-colors"
          aria-label={`Delete table ${table.number}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

const emptyForm = {
  number: "",
  capacity: "2",
  experience: "main",
  status: "available",
  location: "",
  x: 10,
  y: 10,
  width: 80,
  height: 60,
};

export default function FloorPlan() {
  const [tables, setTables] = useState<FloorPlanTable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTables = () => {
    fetch("/api/admin/floor-plan")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTables(data.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (table: FloorPlanTable) => {
    setEditingId(table.id);
    setForm({
      number: String(table.number),
      capacity: String(table.capacity),
      experience: table.experience,
      status: table.status,
      location: table.location || "",
      x: table.x,
      y: table.y,
      width: table.width,
      height: table.height,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        number: parseInt(form.number),
        capacity: parseInt(form.capacity),
      };
      const res = await fetch("/api/admin/floor-plan", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchTables();
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table? Reservations for it will be kept.")) return;
    const res = await fetch(`/api/admin/floor-plan?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchTables();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ivory">Floor Plan</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={openAdd}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus size={14} />
            Add Table
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border/50 p-6 relative min-h-[500px]">
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

        {tables.map((table) => (
          <TableTile
            key={table.id}
            table={table}
            onEdit={() => openEdit(table)}
            onDelete={() => handleDelete(table.id)}
          />
        ))}

        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-ivory-dim text-sm">No tables configured yet.</p>
            <button
              onClick={openAdd}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Plus size={14} />
              Add First Table
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {tables.map((table) => (
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-border/50 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
                {editingId ? "Edit Table" : "Add Table"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-ivory-dim hover:text-ivory transition-colors p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                    Table Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                    Capacity
                  </label>
                  <select
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  >
                    {[1, 2, 4, 6, 8, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} seats
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                    Experience
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value as TableExperience })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  >
                    {experiences.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp.charAt(0).toUpperCase() + exp.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TableStatus })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                  Location / Section
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  placeholder="Main Dining"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                  Floor Plan Position
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase text-ivory-dim mb-1">X (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={form.x}
                      onChange={(e) => setForm({ ...form, x: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg border border-border-light text-ivory px-2 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-ivory-dim mb-1">Y (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={form.y}
                      onChange={(e) => setForm({ ...form, y: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg border border-border-light text-ivory px-2 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-ivory-dim mb-1">W (px)</label>
                    <input
                      type="number"
                      min={40}
                      max={200}
                      value={form.width}
                      onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 80 })}
                      className="w-full bg-bg border border-border-light text-ivory px-2 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-ivory-dim mb-1">H (px)</label>
                    <input
                      type="number"
                      min={40}
                      max={200}
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 60 })}
                      className="w-full bg-bg border border-border-light text-ivory px-2 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-ivory-dim hover:text-ivory transition-colors uppercase tracking-[0.15em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Table"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}