import { NextRequest, NextResponse } from "next/server";
import {
  listKitchenOrders,
  createKitchenOrder,
  updateOrderItemStatus,
  KITCHEN_ITEM_FLOW,
  updateOrderStatus,
} from "@/lib/db";
import { requireKitchen } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireKitchen(request);
  if (auth instanceof NextResponse) return auth;
  const data = await listKitchenOrders();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await requireKitchen(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const { orderNumber, tableNumber, items, priority, status } = body;

  const newOrder = await createKitchenOrder({
    orderNumber,
    tableNumber,
    items,
    priority,
    status,
  });

  return NextResponse.json({ success: true, data: newOrder });
}

/**
 * Advance a dish.
 *
 * Accepts `itemId` to move a single dish (the normal case — a starter can be
 * plated while the main is still cooking), or `orderId` to advance every
 * unfinished dish on a ticket. Either way the transitions are limited to the
 * kitchen's own flow, which stops at `ready`: serving is the waiter's action
 * and cannot be performed here.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireKitchen(request);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { orderId, id, itemId, status } = body || {};
  if (!status || (!id && !itemId && !orderId)) {
    return NextResponse.json(
      { success: false, error: "status and itemId (or orderId) are required" },
      { status: 400 }
    );
  }

  // Refuse `served` explicitly: the kitchen must not be able to record a
  // handover it did not perform.
  if (status === "served") {
    return NextResponse.json(
      {
        success: false,
        error: "The kitchen cannot mark a dish served — the waiter hands it over.",
      },
      { status: 403 }
    );
  }

  try {
    if (itemId) {
      const item = await updateOrderItemStatus(itemId, status, KITCHEN_ITEM_FLOW);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Dish not found or invalid transition" },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: true, data: item });
    }

    const target = orderId || id;
    const updated = await updateOrderStatus(target, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Order not found or invalid status transition" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    console.error("kitchen PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update the dish" },
      { status: 500 }
    );
  }
}