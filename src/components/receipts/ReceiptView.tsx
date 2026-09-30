"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Receipt } from "@/lib/types";
import { restaurant } from "@/lib/data";

const receiptMeta = {
  address: "123 Innovation Avenue, Yangon, Myanmar",
  phone: "+95 9 123 456 789",
  email: "hello@futurebite.com",
};

/**
 * Shared receipt layout for E-receipts and physical (print) receipts.
 * The parent controls printing — this stays visible under `@media print`
 * while the app UI around it is hidden with `print:hidden`.
 */
export default function ReceiptView({ receipt }: { receipt: Receipt }) {
  const date = new Date(receipt.createdAt);
  const meta = {
    address: restaurant.address || receiptMeta.address,
    phone: restaurant.phone || receiptMeta.phone,
  };

  return (
    <div className="bg-white text-neutral-900 w-full max-w-sm mx-auto font-mono text-xs leading-relaxed">
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-neutral-800 pb-4 mb-4">
        <div className="flex justify-center mb-2">
          <Image
            src="/future_bite_logo.jpeg"
            alt={restaurant.name}
            width={96}
            height={52}
            className="h-8 w-auto object-contain"
          />
        </div>
        <h1 className="text-lg font-bold tracking-[0.2em]">
          {restaurant.name.toUpperCase()}
        </h1>
        <p className="mt-1">{meta.address}</p>
        <p>{meta.phone}</p>
      </div>

      {/* Meta */}
      <div className="mb-4 space-y-0.5">
        <div className="flex justify-between">
          <span>Receipt</span>
          <span className="font-bold">{receipt.receiptNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Order</span>
          <span>{receipt.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{date.toLocaleString()}</span>
        </div>
        {receipt.tableNumber && (
          <div className="flex justify-between">
            <span>Table</span>
            <span>{receipt.tableNumber}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Customer</span>
          <span>{receipt.customerName}</span>
        </div>
        {receipt.createdBy && (
          <div className="flex justify-between">
            <span>Cashier</span>
            <span>{receipt.createdBy}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-y-2 border-dashed border-neutral-800 py-3 mb-4">
        <div className="flex justify-between font-bold mb-2">
          <span>ITEM</span>
          <span>AMOUNT</span>
        </div>
        {(receipt.items || []).map((it) => (
          <div key={it.id} className="py-1">
            <div className="flex justify-between">
              <span>
                {it.quantity} × {it.name}
              </span>
              <span>{formatPrice(it.price * it.quantity)}</span>
            </div>
            {it.variants?.map((v) => (
              <div key={v} className="text-neutral-500 pl-3">
                • {v}
              </div>
            ))}
            {it.addons?.map((a) => (
              <div key={a.name} className="flex justify-between pl-3 text-neutral-500">
                <span>+ {a.name}</span>
                <span>{formatPrice(a.price)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(receipt.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (10%)</span>
          <span>{formatPrice(receipt.tax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Charge (5%)</span>
          <span>{formatPrice(receipt.serviceCharge)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-neutral-800 pt-2 mt-2">
          <span>TOTAL</span>
          <span>{formatPrice(receipt.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="border-t-2 border-dashed border-neutral-800 pt-3 pb-4 flex justify-between uppercase tracking-wider">
        <span>Paid via {receipt.paymentMethod}</span>
        <span>{receipt.receiptType === "e" ? "E-RECEIPT" : "RECEIPT"}</span>
      </div>

      {/* Footer */}
      <p className="text-center text-neutral-600">
        Thank you for dining with us!
      </p>
      <p className="text-center text-neutral-500 mt-1">
        {restaurant.email}
      </p>
    </div>
  );
}