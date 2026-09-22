import { getCloudflareContext } from "@opennextjs/cloudflare";

export type UserRole =
  | "admin"
  | "manager"
  | "kitchen"
  | "waiter"
  | "host"
  | "customer";

export interface DbUser {
  id: string;
  branch_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  name: string;
  role: UserRole;
  phone: string;
  is_active: number;
  points: number;
  created_at: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  createdAt: string;
}

export interface DbReservation {
  id: string;
  confirmation_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  table_number: number;
  experience: string;
  special_requests: string;
  status: string;
  created_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  variants: string;
  addons: string;
  special_instructions: string;
  status: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  table_number: number;
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  status: string;
  payment_status: string;
  special_instructions: string;
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
}

export interface DbDish {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  ingredients: string;
  allergens: string;
  dietary: string;
  is_available: number;
  is_featured: number;
  preparation_time: number;
}

export interface DbTable {
  id: string;
  number: string | number;
  capacity: number;
  experience: string;
  status: string;
  location: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DbKitchenOrder {
  id: string;
  order_id: string;
  order_number: string;
  table_number: number;
  priority: string;
  status: string;
  elapsed: number;
  created_at: string;
  items?: DbOrderItem[];
}

interface SessionRecord {
  userId: string;
  role: string;
  email: string;
  name: string;
}

export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error("D1 binding `DB` is not configured");
  }
  return env.DB;
}

export function getKV(): KVNamespace {
  const { env } = getCloudflareContext();
  if (!env.SESSIONS) {
    throw new Error("KV binding `SESSIONS` is not configured");
  }
  return env.SESSIONS;
}

async function notifyRealtime(payload?: unknown): Promise<void> {
  let realtime;
  let httpUrl;
  try {
    const env = getCloudflareContext().env;
    realtime = env.REALTIME;
    httpUrl = env.REALTIME_HTTP_URL;
  } catch {
    return;
  }
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || { type: "updated" }),
  };
  try {
    if (realtime) {
      await realtime.fetch("https://realtime.local/notify", init);
    } else if (httpUrl) {
      await fetch(`${httpUrl.replace(/\/$/, "")}/notify`, init);
    }
  } catch {
    // realtime worker not available (local dev) — degrade gracefully
  }
}

// ---- Socket-compatible helpers (keep old names for route reuse) ----
export async function readDB(): Promise<null> {
  return null;
}

export async function writeDB(_db: unknown): Promise<void> {
  void _db;
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function sanitizeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    createdAt: user.created_at,
  };
}

export const DEMO_ACCOUNTS = [
  { email: "admin@futurebite.com", password: "admin123", role: "admin", name: "Alex Kim" },
  { email: "manager@futurebite.com", password: "manager123", role: "manager", name: "Maya Thompson" },
  { email: "kitchen@futurebite.com", password: "kitchen123", role: "kitchen", name: "Chef Nakamura" },
  { email: "customer@futurebite.com", password: "guest123", role: "customer", name: "Guest" },
];

// ---- Password hashing (PBKDF2 via WebCrypto, format: pbkdf2:sha256:<iters>:<salt-hex>:<hash-hex>) ----
export function loadHash(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await loadHash(password);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: 100000 },
    key,
    256
  );
  const hex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:sha256:100000:${saltHex}:${hex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, algo, itersStr, saltHex, hashHex] = stored.split(":");
    if (scheme !== "pbkdf2" || !algo || !itersStr || !saltHex || !hashHex) return false;
    const iterations = parseInt(itersStr, 10);
    const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const key = await loadHash(password);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
      key,
      256
    );
    const hex = Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === hashHex;
  } catch {
    return false;
  }
}

// ---- Sessions (KV primary, D1 durable) ----
export async function createSession(user: DbUser): Promise<string> {
  const token = generateToken();
  const record: SessionRecord = {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  await getKV().put(`session:${token}`, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 7,
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await getDB()
    .prepare("INSERT OR IGNORE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, user.id, expiresAt)
    .run();
  return token;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  if (!token) return null;
  const cached = await getKV().get(`session:${token}`);
  if (cached) {
    try {
      return JSON.parse(cached) as SessionRecord;
    } catch {
      return null;
    }
  }
  const row = await getDB()
    .prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?")
    .bind(token, new Date().toISOString())
    .first<DbUser>();
  if (row) {
    const record: SessionRecord = {
      userId: row.id,
      role: row.role,
      email: row.email,
      name: row.name,
    };
    await getKV().put(`session:${token}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 7,
    });
    return record;
  }
  return null;
}

export async function deleteSession(token: string): Promise<void> {
  await getKV().delete(`session:${token}`);
  await getDB().prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

// ---- Users ----
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const normalized = email.toLowerCase();
  const row = await getDB()
    .prepare(
      "SELECT * FROM users WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1"
    )
    .bind(normalized)
    .first<DbUser>();
  return row || null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  return getDB().prepare("SELECT * FROM users WHERE id = ?").bind(id).first<DbUser>();
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}): Promise<DbUser> {
  const id = `user-${generateToken().slice(0, 8)}`;
  const hash = await hashPassword(data.password);
  await getDB()
    .prepare(
      `INSERT INTO users (id, branch_id, email, password_hash, first_name, last_name, name, role, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.email.toLowerCase(),
      hash,
      data.name,
      "",
      data.name,
      data.role || "customer",
      data.phone || ""
    )
    .run();
  return (await findUserById(id))!;
}

// ---- Menu ----
export async function listCategories() {
  const { results } = await getDB()
    .prepare(
      "SELECT id, name, slug, description, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC"
    )
    .all();
  return results.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    displayOrder: c.display_order,
  }));
}

export async function listDishes() {
  const { results } = await getDB()
    .prepare(
      "SELECT d.*, c.name as category, c.slug as category_slug FROM dishes d JOIN categories c ON c.id = d.category_id WHERE d.is_available = 1 ORDER BY d.display_order ASC, d.name ASC"
    )
    .all();
  return results.map((d: any) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    price: d.price,
    category: d.category,
    categorySlug: d.category_slug,
    imageUrl: d.image_url,
    ingredients: safeJson(d.ingredients),
    allergens: safeJson(d.allergens),
    dietary: safeJson(d.dietary),
    isAvailable: d.is_available === 1,
    isFeatured: d.is_featured === 1,
    preparationTime: d.preparation_time,
  }));
}

export async function getAllDishes() {
  const { results } = await getDB()
    .prepare("SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON c.id = d.category_id")
    .all();
  return results.map((d: any) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    category: d.category_name || "",
    isAvailable: d.is_available === 1,
    isFeatured: d.is_featured === 1,
    slug: d.slug,
  }));
}

export async function getDishById(id: string) {
  const row = await getDB()
    .prepare("SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON c.id = d.category_id WHERE d.id = ?")
    .bind(id)
    .first<any>();
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category_name || "",
    isAvailable: row.is_available === 1,
    isFeatured: row.is_featured === 1,
  };
}

export async function createDish(data: any): Promise<any> {
  const id = data.id || `dish-${Date.now()}`;
  await getDB()
    .prepare(
      `INSERT INTO dishes (id, branch_id, category_id, name, slug, description, price, ingredients, allergens, dietary, is_available, is_featured, preparation_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.category_id || "cat-1",
      data.name,
      data.slug || slugify(data.name),
      data.description || "",
      parseInt(data.price) || 0,
      JSON.stringify(data.ingredients || []),
      JSON.stringify(data.allergens || []),
      JSON.stringify(data.dietary || []),
      data.isAvailable === undefined ? 1 : data.isAvailable ? 1 : 0,
      data.isFeatured === undefined ? 0 : data.isFeatured ? 1 : 0,
      parseInt(data.preparationTime) || 15
    )
    .run();
  return { id, ...data, createdAt: new Date().toISOString() };
}

export async function updateDish(id: string, updates: any): Promise<any> {
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, any> = {
    name: "name",
    description: "description",
    price: "price",
    isAvailable: "is_available",
    isFeatured: "is_featured",
    slug: "slug",
    category: "category_id",
  };
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(
        key === "isAvailable" || key === "isFeatured"
          ? updates[key]
            ? 1
            : 0
          : updates[key]
      );
    }
  }
  if (sets.length === 0) return null;
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  params.push(id);
  await getDB()
    .prepare(`UPDATE dishes SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
  return getDishById(id);
}

export async function deleteDish(id: string): Promise<boolean> {
  await getDB().prepare("DELETE FROM dishes WHERE id = ?").bind(id).run();
  return true;
}

// ---- Tables ----
export async function listTables(): Promise<DbTable[]> {
  const { results } = await getDB()
    .prepare("SELECT * FROM tables WHERE is_active = 1 ORDER BY number ASC")
    .all<any>();
  return results.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    experience: t.experience,
    status: t.status,
    location: t.location || "",
    x: t.x || 0,
    y: t.y || 0,
    width: t.width || 80,
    height: t.height || 60,
  }));
}

export async function updateTableStatus(tableNumber: number, status: string): Promise<void> {
  await getDB()
    .prepare("UPDATE tables SET status = ? WHERE number = ?")
    .bind(status, tableNumber)
    .run();
}

export async function createTable(data: any): Promise<any> {
  const id = data.id || `tbl-${Date.now()}`;
  const number =
    data.number !== undefined && data.number !== null
      ? parseInt(data.number)
      : await nextTableNumber();
  await getDB()
    .prepare(
      `INSERT INTO tables (id, branch_id, number, capacity, experience, status, location, x, y, width, height, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .bind(
      id,
      "default-branch",
      number,
      parseInt(data.capacity) || 2,
      data.experience || "main",
      data.status || "available",
      data.location || "",
      data.x !== undefined ? parseInt(data.x) : 0,
      data.y !== undefined ? parseInt(data.y) : 0,
      data.width !== undefined ? parseInt(data.width) : 80,
      data.height !== undefined ? parseInt(data.height) : 60
    )
    .run();
  const created = await listTables();
  return created.find((t: any) => t.id === id) || { id, number, ...data };
}

export async function updateTable(id: string, updates: any): Promise<any> {
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, string> = {
    number: "number",
    capacity: "capacity",
    experience: "experience",
    status: "status",
    location: "location",
    x: "x",
    y: "y",
    width: "width",
    height: "height",
  };
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(updates[key]);
    }
  }
  if (sets.length === 0) return null;
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  params.push(id);
  await getDB()
    .prepare(`UPDATE tables SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
  const all = await listTables();
  return all.find((t: any) => t.id === id) || null;
}

export async function deleteTable(id: string): Promise<boolean> {
  await getDB()
    .prepare("UPDATE tables SET is_active = 0 WHERE id = ?")
    .bind(id)
    .run();
  return true;
}

async function nextTableNumber(): Promise<number> {
  const row = await getDB()
    .prepare("SELECT COALESCE(MAX(number), 0) as max FROM tables")
    .first<any>();
  return (row?.max || 0) + 1;
}

// ---- Counters ----
export async function nextCounter(name: string): Promise<number> {
  const row = await getDB()
    .prepare("UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value")
    .bind(name)
    .first<any>();
  return row ? row.value : 1;
}

// ---- Reservations ----
export async function createReservation(data: any): Promise<any> {
  const counter = await nextCounter("reservation");
  const confirmationCode =
    data.confirmationCode || `FB-${new Date().getFullYear()}-${String(counter).padStart(4, "0")}`;
  const id = data.id || `res-${generateToken().slice(0, 8)}`;
  const tableNumber =
    data.tableNumber !== undefined ? data.tableNumber : data.table?.number || 1;
  const status = data.status || "confirmed";
  const reservation = {
    id,
    confirmationCode,
    customerName: data.customerName || data.name || "Guest",
    customerEmail: data.customerEmail || data.email || "",
    customerPhone: data.customerPhone || data.phone || "",
    date: data.date,
    time: data.time,
    partySize: data.partySize,
    tableNumber,
    experience: data.experience || "main",
    specialRequests: data.specialRequests || data.preferences?.join(", ") || "",
    preferences: data.preferences || [],
    status,
    createdAt: new Date().toISOString(),
  };
  await getDB()
    .prepare(
      `INSERT INTO reservations (id, branch_id, confirmation_code, customer_name, customer_email, customer_phone, date, time, party_size, table_number, experience, special_requests, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      confirmationCode,
      reservation.customerName,
      reservation.customerEmail,
      reservation.customerPhone,
      data.date,
      data.time,
      data.partySize,
      tableNumber,
      reservation.experience,
      reservation.specialRequests,
      status
    )
    .run();
  await notifyRealtime({ type: "reservations" });
  return reservation;
}

export async function listReservations(): Promise<any[]> {
  const { results } = await getDB()
    .prepare("SELECT * FROM reservations ORDER BY created_at DESC")
    .all<any>();
  return results.map((r: any) => ({
    id: r.id,
    confirmationCode: r.confirmation_code,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    tableNumber: r.table_number,
    experience: r.experience,
    specialRequests: r.special_requests,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function reservationsOn(date: string, time?: string): Promise<any[]> {
  return (await listReservations()).filter(
    (r) =>
      r.date === date &&
      r.status !== "cancelled" &&
      r.status !== "no-show" &&
      (time ? r.time === time : true)
  );
}

// ---- Orders ----
export async function createOrder(data: any): Promise<any> {
  const counter = await nextCounter("order");
  const id = data.id || `ord-${generateToken().slice(0, 8)}`;
  const orderNumber = data.orderNumber || `#${counter}`;
  const validatedItems = (data.items || []).map((item: any, i: number) => ({
    id: item.id || `oi-${id}-${i}`,
    menuItemId: item.menuItemId || item.id || "dish-001",
    name: item.name || "Unknown",
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    price: Math.max(0, parseInt(item.price) || 0),
    variants: item.variants || [],
    addons: item.addons || [],
    specialInstructions: item.specialInstructions || "",
  }));

  const subtotal = validatedItems.reduce(
    (s: number, it: any) => s + it.price * it.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;
  const now = new Date().toISOString();

  const order = {
    id,
    orderNumber,
    tableId: data.tableId,
    tableNumber: data.tableNumber,
    items: validatedItems.map((it: any) => ({
      ...it,
      status: "pending",
    })),
    subtotal,
    tax,
    serviceCharge,
    total,
    status: "pending",
    paymentStatus: "pending",
    specialInstructions: data.specialInstructions || "",
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  await db.batch([
    db
      .prepare(
        `INSERT INTO orders (id, branch_id, order_number, user_id, table_number, subtotal, tax, service_charge, total, status, payment_status, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        "default-branch",
        orderNumber,
        data.userId || null,
        data.tableNumber || null,
        subtotal,
        tax,
        serviceCharge,
        total,
        "pending",
        "pending",
        order.specialInstructions
      ),
    ...validatedItems.map((it: any) =>
      db
        .prepare(
          `INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, price, variants, addons, special_instructions, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          it.id,
          id,
          it.menuItemId,
          it.name,
          it.quantity,
          it.price,
          JSON.stringify(it.variants),
          JSON.stringify(it.addons),
          it.specialInstructions,
          "pending"
        )
    ),
  ]);

  await notifyRealtime({ type: "orders" });
  return order;
}

export async function listOrders(): Promise<any[]> {
  const { results: orders } = await getDB()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all<any>();
  return await injectOrderItems(orders);
}

export async function getOrder(id: string): Promise<any | null> {
  const order = await getDB()
    .prepare("SELECT * FROM orders WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!order) return null;
  const items = await getDB()
    .prepare("SELECT * FROM order_items WHERE order_id = ?")
    .bind(id)
    .all<any>();
  return { ...order, items: items.results };
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<any> {
  const occurred = await getDB()
    .prepare(
      `UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? RETURNING *`
    )
    .bind(status, id)
    .first<any>();
  await getDB()
    .prepare(
      `UPDATE kitchen_orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE order_id = ?`
    )
    .bind(status, id)
    .run();
  await notifyRealtime({ type: "orders", orderId: id });
  return occurred;
}

async function injectOrderItems(orders: any[]): Promise<any[]> {
  if (orders.length === 0) return [];
  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: items } = await getDB()
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
    .bind(...ids)
    .all<any>();
  const grouped: Record<string, any[]> = {};
  for (const it of items) {
    (grouped[it.order_id] ||= []).push(it);
  }
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    tableId: o.table_id,
    tableNumber: o.table_number,
    items: grouped[o.id] || [],
    subtotal: o.subtotal,
    tax: o.tax,
    serviceCharge: o.service_charge,
    total: o.total,
    status: o.status,
    paymentStatus: o.payment_status,
    specialInstructions: o.special_instructions,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));
}

// ---- Kitchen ----
export async function listKitchenOrders(): Promise<any[]> {
  const { results: orders } = await getDB()
    .prepare(
      "SELECT * FROM kitchen_orders ORDER BY created_at DESC, status ASC"
    )
    .all<any>();
  if (orders.length === 0) return [];
  const ids = orders.map((o) => o.order_id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: items } = await getDB()
    .prepare(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) AND status != 'served' AND status != 'completed' AND status != 'cancelled'`
    )
    .bind(...ids)
    .all<any>();
  const grouped: Record<string, any[]> = {};
  for (const it of items) {
    (grouped[it.order_id] ||= []).push(it);
  }
  return orders.map((o) => ({
    id: o.order_id,
    orderNumber: o.order_number,
    tableNumber: o.table_number,
    priority: o.priority,
    status: o.status,
    elapsed: o.elapsed,
    createdAt: o.created_at,
    items: grouped[o.order_id] || [],
  }));
}

export async function createKitchenOrder(data: any): Promise<any> {
  void data.orderId;
  void data.id;
  const counter = await nextCounter("order");
  const orderNumber = data.orderNumber || `#${counter}`;
  const items = data.items || [
    { name: "New Dish", quantity: 1, status: "pending", specialInstructions: "" },
  ];
  const db = getDB();
  const orderId = `ord-${generateToken().slice(0, 8)}`;
  await db
    .prepare(
      `INSERT INTO orders (id, branch_id, order_number, table_number, subtotal, tax, service_charge, total, status, payment_status)
       VALUES (?, ?, ?, ?, 0, 0, 0, 0, ?, 'pending')`
    )
    .bind(
      orderId,
      "default-branch",
      orderNumber,
      data.tableNumber || 1,
      data.status || "pending"
    )
    .run();
  await db
    .prepare(
      `INSERT INTO kitchen_orders (id, order_id, branch_id, order_number, table_number, priority, status, elapsed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(
      `ko-${Date.now()}`,
      orderId,
      "default-branch",
      orderNumber,
      data.tableNumber || 1,
      data.priority || "normal",
      data.status || "pending"
    )
    .run();
  await db.batch(
    items.map((it: any, i: number) =>
      db
        .prepare(
          `INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, price, special_instructions, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          `oi-${Date.now()}-${i}`,
          orderId,
          it.menuItemId || "dish-001",
          it.name || "New Dish",
          it.quantity || 1,
          it.price || 0,
          it.specialInstructions || "",
          it.status || "pending"
        )
    )
  );
  await notifyRealtime({ type: "kitchen" });
  return { id: orderId, orderNumber, tableNumber: data.tableNumber || 1, status: data.status || "pending" };
}

export async function updateKitchenOrderStatus(orderId: string, status: string): Promise<void> {
  await updateOrderStatus(orderId, status);
}

// ---- Staff ----
export async function listStaff(): Promise<any[]> {
  const { results } = await getDB()
    .prepare("SELECT * FROM staff WHERE is_active = 1 ORDER BY name ASC")
    .all<any>();
  return results.map((s: any) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    phone: s.phone,
    isActive: s.is_active === 1,
    shift: s.shift,
  }));
}

export async function createStaff(data: any): Promise<any> {
  const id = data.id || `staff-${Date.now()}`;
  await getDB()
    .prepare(
      `INSERT INTO staff (id, branch_id, name, email, role, phone, is_active, shift)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.name,
      data.email || "",
      data.role || "waiter",
      data.phone || "",
      data.isActive === undefined ? 1 : data.isActive ? 1 : 0,
      data.shift || "Evening"
    )
    .run();
  return { id, ...data, createdAt: new Date().toISOString() };
}

// ---- Inventory / Ingredients ----
export async function listSupplies(): Promise<any[]> {
  const { results } = await getDB()
    .prepare("SELECT * FROM supplies ORDER BY name ASC")
    .all<any>();
  return results.map((s: any) => ({
    id: s.id,
    name: s.name,
    unit: s.unit,
    currentStock: s.current_stock,
    minimumStock: s.minimum_stock,
    cost: s.cost,
    supplier: s.supplier,
    status: s.status,
    lastUpdated: s.last_updated,
  }));
}

export async function createSupply(data: any): Promise<any> {
  const id = data.id || `sup-${Date.now()}`;
  const currentStock = parseFloat(data.currentStock) || 0;
  const minimumStock = parseFloat(data.minimumStock) || 0;
  const stockStatus =
    currentStock <= 0
      ? "critical"
      : currentStock <= minimumStock
      ? "low"
      : "healthy";
  await getDB()
    .prepare(
      `INSERT INTO supplies (id, branch_id, name, unit, current_stock, minimum_stock, cost, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.name,
      data.unit || "pcs",
      currentStock,
      minimumStock,
      parseFloat(data.cost) || 0,
      data.supplier || "",
      stockStatus
    )
    .run();
  if (data.notes || currentStock > 0) {
    await logSupplyTransaction(
      id,
      data.initialType || "adjustment",
      currentStock,
      data.cost,
      data.notes || "Initial stock"
    );
  }
  return { id, ...data, currentStock, minimumStock, status: stockStatus };
}

export async function updateSupply(id: string, updates: any): Promise<any> {
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, string> = {
    name: "name",
    unit: "unit",
    supplier: "supplier",
    cost: "cost",
    minimumStock: "minimum_stock",
    currentStock: "current_stock",
    status: "status",
  };
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(updates[key]);
    }
  }
  if (sets.length === 0) return null;
  sets.push("last_updated = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  params.push(id);
  await getDB()
    .prepare(`UPDATE supplies SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
  await ensureSupplyStatus(id);
  const all = await listSupplies();
  return all.find((s: any) => s.id === id) || null;
}

export async function deleteSupply(id: string): Promise<boolean> {
  await getDB().prepare("DELETE FROM supplies WHERE id = ?").bind(id).run();
  return true;
}

export async function adjustSupplyStock(
  id: string,
  delta: number,
  type: string,
  notes = "",
  createdBy = ""
): Promise<any> {
  const current = await getDB()
    .prepare("SELECT * FROM supplies WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!current) return null;
  const newStock = Math.max(0, (current.current_stock || 0) + delta);
  await getDB()
    .prepare(
      `UPDATE supplies SET current_stock = ?, status = ?, last_updated = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    )
    .bind(
      newStock,
      newStock <= 0 ? "critical" : newStock <= (current.minimum_stock || 0) ? "low" : "healthy",
      id
    )
    .run();
  await logSupplyTransaction(
    id,
    type,
    delta,
    current.cost,
    notes,
    createdBy
  );
  const all = await listSupplies();
  return all.find((s: any) => s.id === id) || { id, currentStock: newStock };
}

export async function logSupplyTransaction(
  supplyId: string,
  type: string,
  quantity: number,
  unitCost = 0,
  notes = "",
  createdBy = ""
): Promise<any> {
  const id = `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record = {
    id,
    supplyId,
    type,
    quantity,
    unitCost,
    totalCost: parseFloat(unitCost.toString()) * Math.abs(parseFloat(quantity.toString()) || 0),
    notes,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  await getDB()
    .prepare(
      `INSERT INTO supply_transactions (id, branch_id, supply_id, type, quantity, unit_cost, total_cost, reference, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      supplyId,
      type,
      quantity,
      record.unitCost,
      record.totalCost,
      "",
      notes,
      createdBy
    )
    .run();
  return record;
}

export async function listSupplyTransactions(supplyId?: string): Promise<any[]> {
  const sql = supplyId
    ? "SELECT * FROM supply_transactions WHERE supply_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM supply_transactions ORDER BY created_at DESC";
  const { results } = supplyId
    ? await getDB().prepare(sql).bind(supplyId).all<any>()
    : await getDB().prepare(sql).all<any>();
  return results.map((t: any) => ({
    id: t.id,
    supplyId: t.supply_id,
    type: t.type,
    quantity: t.quantity,
    unitCost: t.unit_cost,
    totalCost: t.total_cost,
    notes: t.notes,
    createdBy: t.created_by,
    createdAt: t.created_at,
  }));
}

export async function getSupplyStock(supplyId: string): Promise<number> {
  const row = await getDB()
    .prepare("SELECT current_stock FROM supplies WHERE id = ?")
    .bind(supplyId)
    .first<any>();
  return row?.current_stock || 0;
}

async function ensureSupplyStatus(id: string): Promise<void> {
  const row = await getDB()
    .prepare("SELECT * FROM supplies WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!row) return;
  const status =
    (row.current_stock || 0) <= 0
      ? "critical"
      : (row.current_stock || 0) <= (row.minimum_stock || 0)
      ? "low"
      : "healthy";
  if (row.status !== status) {
    await getDB()
      .prepare("UPDATE supplies SET status = ? WHERE id = ?")
      .bind(status, id)
      .run();
  }
}

// ---- Analytics ----
export async function getAnalytics(): Promise<any> {
  const today = new Date().toISOString().slice(0, 10);
  const [resRows, orderRows, kitchenRow, revenueRow, recentOrders, coversRow] =
    await Promise.all([
      getDB()
        .prepare("SELECT COUNT(*) as c FROM reservations WHERE date = ?")
        .bind(today)
        .first<any>(),
      getDB()
        .prepare("SELECT COUNT(*) as c FROM orders WHERE created_at >= ?")
        .bind(today + "T00:00:00")
        .first<any>(),
      getDB()
        .prepare("SELECT COUNT(*) as c FROM kitchen_orders WHERE status IN ('pending', 'preparing', 'plating')")
        .first<any>(),
      getDB()
        .prepare("SELECT COALESCE(SUM(total), 0) as s, COALESCE(AVG(total), 0) as a FROM orders WHERE created_at >= ? AND status != 'cancelled'")
        .bind(today + "T00:00:00")
        .first<any>(),
      getDB()
        .prepare("SELECT oi.name, SUM(oi.quantity) as orders FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status != 'cancelled' GROUP BY oi.name ORDER BY orders DESC LIMIT 5")
        .all<any>(),
      getDB()
        .prepare("SELECT COALESCE(SUM(capacity), 0) as s FROM tables WHERE status = 'seated'")
        .first<any>(),
    ]);

  // Weekly revenue from daily_sales
  const { results: weekly } = await getDB()
    .prepare("SELECT date, total_revenue FROM daily_sales ORDER BY date ASC LIMIT 7")
    .all<any>();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyRevenue = weekly.map((w: any) => ({
    day: dayNames[new Date(w.date).getDay()],
    revenue: w.total_revenue,
  }));

  const occupancy = Math.min(100, Math.round(((orderRows?.c || 0) * 5) / 6 * 10) / 10);

  return {
    todayReservations: resRows?.c || 0,
    todayOrders: orderRows?.c || 0,
    currentCovers: coversRow?.s || 0,
    kitchenQueue: kitchenRow?.c || 0,
    revenue: revenueRow?.s || 0,
    averageOrderValue: Math.round(revenueRow?.a || 0),
    occupancy,
    popularDishes: (recentOrders?.results || []).map((d: any) => ({
      name: d.name,
      orders: d.orders,
    })),
    weeklyRevenue,
  };
}

// ---- Helpers ----
function safeJson(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}