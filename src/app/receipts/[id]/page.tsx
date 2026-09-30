"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import ReceiptView from "@/components/receipts/ReceiptView";
import type { Receipt } from "@/lib/types";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReceipt(data.data);
        else setError(data.error || "Receipt not found");
      })
      .catch(() => setError("Connection error"));
  }, [id]);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-start justify-center p-4 print:hidden">
      <div className="w-full max-w-sm">
        <div className="print:hidden flex items-center justify-between mb-4">
          <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-[0.15em]">
            E-Receipt
          </h1>
          {receipt && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] hover:bg-neutral-700 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
          )}
        </div>

        {error && (
          <div className="bg-white border border-red-200 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        {!receipt && !error && (
          <div className="bg-white p-6 text-center text-sm text-neutral-500">
            Loading receipt…
          </div>
        )}
        {receipt && (
          <div className="bg-white p-6">
            <ReceiptView receipt={receipt} />
          </div>
        )}
      </div>
    </div>
  );
}