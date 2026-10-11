/**
 * Waiter service — the floor, from a waiter's point of view.
 *
 * Kept separate from `db.ts` because this is a distinct domain surface: the
 * waiter neither sells (that's the POS) nor cooks (that's the kitchen). They
 * take an order against a table and carry finished dishes to it.
 *
 * Money never passes through here. A table order stays unpaid until a cashier
 * settles it at the POS.
 */

import {
  getDB,
  listTables,
  getDishesByIds,
  nextUniqueNumber,
  updateOrderItemStatus,
  WAITER_ITEM_FLOW,
} from "./db";

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Every table, its state, and the running total of anything ordered against
 * it. One bill per table, so `runningTotal` is the table's tab so far.
 */
export async function getWaiterTables(): Promise<any[]> {
  const db = getDB();
  const tables = await listTables();
  const { results } = await db
    .prepare(
      `SELECT table_number,
              COUNT(*) AS order_count,
              COALESCE(SUM(subtotal + tax + service_charge), 0) AS running_total
       FROM orders
       WHERE payment_status = 'pending'
         AND table_number IS NOT NULL
         AND status NOT IN ('completed', 'cancelled')
       GROUP BY table_number`
    )
    .all<any>();

  const byTable = new Map(
    (results || []).map((r: any) => [Number(r.table_number), r])
  );

  return tables.map((t: any) => {
    const open = byTable.get(Number(t.number));
    return {
      id: t.id,
      number: t.number,
      capacity: t.capacity,
      experience: t.experience,
      location: t.location,
      status: t.status,
      hasOpenOrder: Boolean(open),
      openOrderCount: open ? open.order_count : 0,
      runningTotal: open ? open.running_total : 0,
    };
  });
}

/**
 * Take a table order, or append to the open one when the table already has it.
 *
 * A table has one bill, not one order per visit — a guest adding a dessert
 * later joins the same tab. Prices always come from the database; a price sent
 * by the caller is ignored entirely.
 */
export async function takeTableOrder(data: {
  tableNumber: number;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  waiterId?: string;
}): Promise<{ orderId: string; orderNumber: string; appended: boolean }> {
  const { tableNumber, items, waiterId } = data;
  const db = getDB();

  const dishes = await getDishesByIds(items.map((i) => i.menuItemId));
  const byId = new Map(dishes.map((d: any) => [d.id, d]));

  const priced = items.map((line, idx) => {
    const dish = byId.get(line.menuItemId);
    if (!dish) throw new Error(`Dish not found: ${line.menuItemId}`);
    if (!dish.isAvailable) {
      throw new Error(`"${dish.name}" is currently unavailable`);
    }
    return {
      id: `oi-${generateToken().slice(0, 10)}-${idx}`,
      menuItemId: dish.id,
      name: dish.name,
      quantity: Math.max(
        1,
        Math.min(50, parseInt(String(line.quantity)) || 1)
      ),
      price: dish.price,
      specialInstructions: (line.specialInstructions || "").slice(0, 500),
    };
  });

  const insertItem = (orderId: string) =>
    priced.map((p) =>
      db
        .prepare(
          `INSERT INTO order_items
             (id, order_id, menu_item_id, name, quantity, price, variants, addons, special_instructions, status)
           VALUES (?, ?, ?, ?, ?, ?, '[]', '[]', ?, 'pending')`
        )
        .bind(
          p.id,
          orderId,
          p.menuItemId,
          p.name,
          p.quantity,
          p.price,
          p.specialInstructions
        )
    );

  // An open, unpaid order for this table is the bill to append to.
  const existing = await db
    .prepare(
      `SELECT * FROM orders
       WHERE table_number = ? AND payment_status = 'pending'
         AND status NOT IN ('completed', 'cancelled')
       ORDER BY created_at ASC LIMIT 1`
    )
    .bind(tableNumber)
    .first<any>();

  if (existing) {
    await db.batch(insertItem(existing.id));

    // Re-total from the dishes themselves so the running total cannot drift.
    const { results: allItems } = await db
      .prepare("SELECT quantity, price FROM order_items WHERE order_id = ?")
      .bind(existing.id)
      .all<any>();
    const subtotal = (allItems || []).reduce(
      (s: number, i: any) => s + i.price * i.quantity,
      0
    );
    const tax = Math.round(subtotal * 0.1);
    const serviceCharge = Math.round(subtotal * 0.05);
    await db
      .prepare(
        `UPDATE orders SET subtotal = ?, tax = ?, service_charge = ?, total = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`
      )
      .bind(
        subtotal,
        tax,
        serviceCharge,
        subtotal + tax + serviceCharge,
        existing.id
      )
      .run();

    // Make sure the kitchen still has a ticket for the newly added run.
    const { results: ko } = await db
      .prepare("SELECT 1 FROM kitchen_orders WHERE order_id = ? LIMIT 1")
      .bind(existing.id)
      .all<any>();
    if (!ko || ko.length === 0) {
      await db
        .prepare(
          `INSERT INTO kitchen_orders
             (id, order_id, branch_id, order_number, table_number, priority, status, elapsed)
           VALUES (?, ?, 'default-branch', ?, ?, 'normal', 'pending', 0)`
        )
        .bind(
          `ko-${existing.id}`,
          existing.id,
          existing.order_number,
          tableNumber
        )
        .run();
    }

    return {
      orderId: existing.id,
      orderNumber: existing.order_number,
      appended: true,
    };
  }

  const orderNumber = await nextUniqueNumber(
    "order",
    "orders",
    "order_number",
    (n) => `#${n}`
  );
  const orderId = `ord-${generateToken().slice(0, 8)}`;
  const addedSubtotal = priced.reduce((s, p) => s + p.price * p.quantity, 0);
  const tax = Math.round(addedSubtotal * 0.1);
  const serviceCharge = Math.round(addedSubtotal * 0.05);

  await db.batch([
    db
      .prepare(
        `INSERT INTO orders
           (id, branch_id, order_number, user_id, table_number, subtotal, tax,
            service_charge, total, status, payment_status, special_instructions, opened_by)
         VALUES (?, 'default-branch', ?, NULL, ?, ?, ?, ?, ?, 'pending', 'pending', '', ?)`
      )
      .bind(
        orderId,
        orderNumber,
        tableNumber,
        addedSubtotal,
        tax,
        serviceCharge,
        addedSubtotal + tax + serviceCharge,
        waiterId || null
      ),
    db
      .prepare(
        `INSERT INTO kitchen_orders
           (id, order_id, branch_id, order_number, table_number, priority, status, elapsed)
         VALUES (?, ?, 'default-branch', ?, ?, 'normal', 'pending', 0)`
      )
      .bind(`ko-${orderId}`, orderId, orderNumber, tableNumber),
    ...insertItem(orderId),
  ]);

  return { orderId, orderNumber, appended: false };
}

/**
 * Hand a ready dish to the table. This is the waiter's half of the handoff —
 * the kitchen stops at "ready" and cannot mark a dish served.
 */
export async function serveDish(
  itemId: string,
  waiterId: string
): Promise<any | null> {
  return updateOrderItemStatus(itemId, "served", WAITER_ITEM_FLOW, waiterId);
}

function minutesBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 60000)) : null;
}

/**
 * The waiter's two lists: dishes the kitchen has finished and that must now be
 * carried out, and what has just gone out, with how long each took from
 * ordered to served.
 */
export async function getWaiterQueue(): Promise<{
  ready: any[];
  served: any[];
}> {
  const db = getDB();

  const { results: readyRows } = await db
    .prepare(
      `SELECT oi.id, oi.name, oi.quantity, oi.special_instructions,
              oi.created_at, oi.updated_at,
              o.order_number, o.table_number
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.status = 'ready'
         AND o.payment_status = 'pending'
         AND o.status NOT IN ('completed', 'cancelled')
       ORDER BY oi.updated_at ASC`
    )
    .all<any>();

  const { results: servedRows } = await db
    .prepare(
      `SELECT oi.id, oi.name, oi.quantity, oi.special_instructions,
              oi.created_at, oi.served_at, oi.served_by,
              o.order_number, o.table_number
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.status = 'served' AND oi.served_at IS NOT NULL
       ORDER BY oi.served_at DESC
       LIMIT 25`
    )
    .all<any>();

  return {
    ready: (readyRows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      quantity: r.quantity,
      specialInstructions: r.special_instructions || "",
      orderNumber: r.order_number,
      tableNumber: r.table_number,
      orderedAt: r.created_at,
      readyForMinutes: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(r.updated_at || r.created_at).getTime()) /
            60000
        )
      ),
    })),
    served: (servedRows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      quantity: r.quantity,
      specialInstructions: r.special_instructions || "",
      orderNumber: r.order_number,
      tableNumber: r.table_number,
      orderedAt: r.created_at,
      servedAt: r.served_at,
      durationMinutes: minutesBetween(r.created_at, r.served_at),
    })),
  };
}