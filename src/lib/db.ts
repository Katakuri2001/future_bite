import { getCloudflareContext } from "@opennextjs/cloudflare";

export type UserRole =
  | "admin"
  | "manager"
  | "kitchen"
  | "waiter"
  | "host"
  | "cashier"
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

export interface SessionRecord {
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
  { email: "cashier@futurebite.com", password: "cashier123", role: "cashier", name: "Nina Park" },
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
    slug: d.slug,
    description: d.description,
    price: d.price,
    category: d.category_name || "",
    categoryId: d.category_id,
    imageUrl: d.image_url,
    ingredients: safeJson(d.ingredients),
    allergens: safeJson(d.allergens),
    dietary: safeJson(d.dietary),
    isAvailable: d.is_available === 1,
    isFeatured: d.is_featured === 1,
    preparationTime: d.preparation_time,
    costPrice: d.cost_price,
    pointsValue: d.points_value,
    displayOrder: d.display_order,
    createdAt: d.created_at,
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
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category_name || "",
    categoryId: row.category_id,
    imageUrl: row.image_url,
    ingredients: safeJson(row.ingredients),
    allergens: safeJson(row.allergens),
    dietary: safeJson(row.dietary),
    isAvailable: row.is_available === 1,
    isFeatured: row.is_featured === 1,
    preparationTime: row.preparation_time,
    costPrice: row.cost_price,
    pointsValue: row.points_value,
    displayOrder: row.display_order,
  };
}

/** Fetch full rows for a set of dish ids (POS checkout price validation). */
export async function getDishesByIds(ids: string[]): Promise<any[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return [];
  const placeholders = unique.map(() => "?").join(",");
  const { results } = await getDB()
    .prepare(`SELECT * FROM dishes WHERE id IN (${placeholders})`)
    .bind(...unique)
    .all<any>();
  return results.map((d: any) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    price: d.price,
    categoryId: d.category_id,
    imageUrl: d.image_url,
    ingredients: safeJson(d.ingredients),
    allergens: safeJson(d.allergens),
    dietary: safeJson(d.dietary),
    isAvailable: d.is_available === 1,
    isFeatured: d.is_featured === 1,
    preparationTime: d.preparation_time,
  }));
}

export async function createDish(data: any): Promise<any> {
  const id = data.id || `dish-${Date.now()}`;
  await getDB()
    .prepare(
      `INSERT INTO dishes (id, branch_id, category_id, name, slug, description, price, image_url, ingredients, allergens, dietary, is_available, is_featured, preparation_time, cost_price, points_value, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.category_id || (data.categoryId as string) || "cat-1",
      data.name,
      data.slug || slugify(data.name),
      data.description || "",
      parseInt(data.price) || 0,
      data.imageUrl || data.image_url || "",
      JSON.stringify(data.ingredients || []),
      JSON.stringify(data.allergens || []),
      JSON.stringify(data.dietary || []),
      data.isAvailable === undefined ? 1 : data.isAvailable ? 1 : 0,
      data.isFeatured === undefined ? 0 : data.isFeatured ? 1 : 0,
      parseInt(data.preparationTime) || 15,
      parseInt(data.costPrice) || 0,
      parseInt(data.pointsValue) || 0,
      parseInt(data.displayOrder) || 0
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
    categoryId: "category_id",
    imageUrl: "image_url",
    ingredients: "ingredients",
    allergens: "allergens",
    dietary: "dietary",
    preparationTime: "preparation_time",
    costPrice: "cost_price",
    pointsValue: "points_value",
    displayOrder: "display_order",
  };
  for (const [key, col] of Object.entries(map)) {
    if (updates[key] !== undefined) {
      sets.push(`${col} = ?`);
      if (key === "isAvailable" || key === "isFeatured") {
        params.push(updates[key] ? 1 : 0);
      } else if (
        key === "ingredients" ||
        key === "allergens" ||
        key === "dietary"
      ) {
        params.push(JSON.stringify(updates[key] || []));
      } else {
        params.push(updates[key]);
      }
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

// ---- Menu Sets (named sets of dishes — tasting menus / combos) ----
function decorateMenuSet(row: any, itemRows: any[]): any {
  const set = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    isAvailable: row.is_available === 1,
    isFeatured: row.is_featured === 1,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
  const computed = itemRows.reduce(
    (sum, e) => sum + (e.dish_price || 0) * (e.quantity || 1),
    0
  );
  return {
    ...set,
    items: itemRows.map((e) => ({
      dishId: e.dish_id,
      name: e.dish_name,
      quantity: e.quantity,
      price: e.dish_price,
      imageUrl: e.dish_image,
      displayOrder: e.display_order,
    })),
    computedPrice: computed,
    effectivePrice: set.price > 0 ? set.price : computed,
  };
}

export async function listMenuSets(): Promise<any[]> {
  const { results } = await getDB()
    .prepare("SELECT * FROM menu_sets ORDER BY display_order ASC, name ASC")
    .all<any>();
  if (results.length === 0) return [];
  // Attach item listings + computed prices.
  const ids = results.map((s) => s.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: items } = await getDB()
    .prepare(
      `SELECT msi.menu_set_id, msi.quantity, msi.display_order, d.id as dish_id, d.name as dish_name,
              d.price as dish_price, d.image_url as dish_image
       FROM menu_set_items msi
       JOIN dishes d ON d.id = msi.dish_id
       WHERE msi.menu_set_id IN (${placeholders})
       ORDER BY msi.display_order ASC`
    )
    .bind(...ids)
    .all<any>();
  const grouped: Record<string, any[]> = {};
  for (const it of items) {
    (grouped[it.menu_set_id] ||= []).push(it);
  }
  return results.map((s) => decorateMenuSet(s, grouped[s.id] || []));
}

export async function getMenuSetById(id: string): Promise<any | null> {
  const row = await getDB()
    .prepare("SELECT * FROM menu_sets WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!row) return null;
  const { results: items } = await getDB()
    .prepare(
      `SELECT msi.quantity, msi.display_order, d.id as dish_id, d.name as dish_name,
              d.price as dish_price, d.image_url as dish_image
       FROM menu_set_items msi
       JOIN dishes d ON d.id = msi.dish_id
       WHERE msi.menu_set_id = ?
       ORDER BY msi.display_order ASC`
    )
    .bind(id)
    .all<any>();
  return decorateMenuSet(row, items);
}

export async function createMenuSet(data: any): Promise<any> {
  const id = data.id || `set-${Date.now()}`;
  const slug = data.slug || slugify(data.name);
  await getDB()
    .prepare(
      `INSERT INTO menu_sets (id, branch_id, name, slug, description, price, image_url, is_available, is_featured, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      data.name,
      slug,
      data.description || "",
      parseInt(data.price) || 0,
      data.imageUrl || "",
      data.isAvailable === undefined ? 1 : data.isAvailable ? 1 : 0,
      data.isFeatured === undefined ? 0 : data.isFeatured ? 1 : 0,
      parseInt(data.displayOrder) || 0
    )
    .run();
  await replaceMenuSetItems(id, data.items || []);
  await notifyRealtime({ type: "menu" });
  return getMenuSetById(id);
}

export async function updateMenuSet(id: string, updates: any): Promise<any> {
  const current = await getDB()
    .prepare("SELECT * FROM menu_sets WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!current) return null;
  const sets: string[] = [];
  const params: any[] = [];
  const map: Record<string, string> = {
    name: "name",
    slug: "slug",
    description: "description",
    price: "price",
    imageUrl: "image_url",
    isAvailable: "is_available",
    isFeatured: "is_featured",
    displayOrder: "display_order",
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
  if (sets.length > 0) {
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    params.push(id);
    await getDB()
      .prepare(`UPDATE menu_sets SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();
  }
  if (updates.items !== undefined) {
    await replaceMenuSetItems(id, updates.items);
  }
  await notifyRealtime({ type: "menu" });
  return getMenuSetById(id);
}

async function replaceMenuSetItems(menuSetId: string, items: any[]): Promise<void> {
  const db = getDB();
  await db
    .prepare("DELETE FROM menu_set_items WHERE menu_set_id = ?")
    .bind(menuSetId)
    .run();
  if (items.length === 0) return;
  await db.batch(
    items.map((it: any, i: number) =>
      db
        .prepare(
          `INSERT INTO menu_set_items (id, menu_set_id, dish_id, quantity, display_order)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          `msi-${menuSetId}-${i}`,
          menuSetId,
          it.dishId,
          parseInt(it.quantity) || 1,
          i
        )
    )
  );
}

export async function deleteMenuSet(id: string): Promise<boolean> {
  await getDB().prepare("DELETE FROM menu_sets WHERE id = ?").bind(id).run();
  await notifyRealtime({ type: "menu" });
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
  // Self-seeding upsert: an unseeded counter (e.g. `receipt`) starts at 1 and
  // increments atomically on every call — no separate seed row required.
  const row = await getDB()
    .prepare(
      `INSERT INTO counters (name, value) VALUES (?, 1)
       ON CONFLICT(name) DO UPDATE SET value = value + 1
       RETURNING value`
    )
    .bind(name)
    .first<any>();
  return row ? row.value : 1;
}

/**
 * Allocate a human-readable document number (e.g. `#1042`, `R-2026-0007`)
 * that is guaranteed not to already exist.
 *
 * `nextCounter` increments atomically, but the counter can drift behind reality
 * (manually inserted rows, a failed batch, a restored backup). Without this
 * guard the next insert hits a UNIQUE constraint and the request 500s — which
 * for a customer means their order is rejected for a reason they cannot see.
 * Reserving the number against the live table makes the drift self-healing.
 */
export async function nextUniqueNumber(
  counterName: string,
  table: string,
  column: string,
  format: (n: number) => string
): Promise<string> {
  const db = getDB();
  for (let attempt = 0; attempt < 25; attempt++) {
    const n = await nextCounter(counterName);
    const candidate = format(n);
    const taken = await db
      .prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`)
      .bind(candidate)
      .first<any>();
    if (!taken) return candidate;
  }
  // Extremely unlikely; fall back to a value no counter can reach.
  return format(await nextCounter(counterName) + 1_000_000);
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
  const id = data.id || `ord-${generateToken().slice(0, 8)}`;
  const orderNumber =
    data.orderNumber ||
    (await nextUniqueNumber("order", "orders", "order_number", (n) => `#${n}`));
  const requestedStatus = data.status || "pending";
  const requestedPayment = data.paymentStatus || "pending";
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
      // Completed POS sales are served immediately, so kitchen items reflect that.
      status: requestedStatus === "completed" ? "served" : "pending",
    })),
    subtotal,
    tax,
    serviceCharge,
    total,
    status: requestedStatus,
    paymentStatus: requestedPayment,
    specialInstructions: data.specialInstructions || "",
    createdAt: now,
    updatedAt: now,
  };

  const db = getDB();
  const statements = [
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
        order.status,
        order.paymentStatus,
        order.specialInstructions
      ),
  ];

  // Completed POS sales are takeaway-style: paid and done — no kitchen job.
  if (order.status !== "completed") {
    statements.push(
      db
        .prepare(
          `INSERT INTO kitchen_orders (id, order_id, branch_id, order_number, table_number, priority, status, elapsed)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)`
        )
        .bind(
          `ko-${id}`,
          id,
          "default-branch",
          orderNumber,
          data.tableNumber || null,
          data.priority || "normal"
        )
    );
  }

  statements.push(
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
          order.status === "completed" ? "served" : "pending"
        )
    )
  );

  await db.batch(statements);

  // NOTE: loyalty points are NOT awarded here. Points accrue on payment
  // settlement (see `createPaidSale`) so abandoned/unpaid orders cannot mint
  // points and `total_spent` only ever counts money actually received.

  await notifyRealtime({ type: "orders" });
  return order;
}

// ---- Loyalty / Royal Points ----
/**
 * Loyalty economics. All amounts are in kyat — the restaurant's operating
 * currency, matching the `dishes.price` column.
 *
 *   • Every KYAT_POINTS_UNIT kyat of settled revenue earns 1 point.
 *   • Every COUPON_POINT_THRESHOLD points earns one spendable
 *     COUPON_VALUE_KYAT coupon.
 *
 * Rates live here rather than inline so the economics are changed in one place.
 */
export const KYAT_POINTS_UNIT = 10000;
export const COUPON_POINT_THRESHOLD = 100;
export const COUPON_VALUE_KYAT = 10000;

/** Points earned by an order of `amountKyat`, floored per complete unit. */
export function pointsForAmount(amountKyat: number): number {
  if (!Number.isFinite(amountKyat) || amountKyat <= 0) return 0;
  return Math.floor(amountKyat / KYAT_POINTS_UNIT);
}

/** Tier thresholds, highest first. Derived from balance alone. */
export function tierForPoints(points: number): "Bronze" | "Silver" | "Gold" | "Diamond" {
  if (points >= 500) return "Diamond";
  if (points >= 200) return "Gold";
  if (points >= COUPON_POINT_THRESHOLD) return "Silver";
  return "Bronze";
}

/** Unique, human-readable coupon code (no ambiguous 0/O/1/I). */
async function generateCouponCode(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  // Retry on the (astronomically unlikely) collision.
  const clash = await getDB()
    .prepare("SELECT 1 FROM coupons WHERE code = ? LIMIT 1")
    .bind(`ROYAL-${suffix}`)
    .first<any>();
  return clash ? `ROYAL-${suffix}${Math.floor(Math.random() * 10)}` : `ROYAL-${suffix}`;
}

/**
 * Award points for a settled (paid) order and issue any newly unlocked coupons.
 * Called from the payment path only — never when an order is merely created.
 */
export async function awardLoyaltyPoints(
  userId: string | undefined,
  orderTotal: number,
  orderId: string,
  orderNumber?: string
): Promise<void> {
  if (!userId) return;

  // Points accrue on the amount actually paid, after any coupon discount, so a
  // discounted order cannot inflate the points balance.
  const pointsEarned = pointsForAmount(orderTotal);
  if (pointsEarned <= 0) return;

  const db = getDB();
  await db
    .prepare("UPDATE users SET points = points + ?, total_spent = total_spent + ? WHERE id = ?")
    .bind(pointsEarned, orderTotal, userId)
    .run();

  await db
    .prepare(
      "INSERT INTO loyalty_events (id, branch_id, user_id, order_id, points_earned, reason) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      `loy-${Date.now()}`,
      "default-branch",
      userId,
      orderId,
      pointsEarned,
      `Earned ${pointsEarned} pts from paid order ${orderNumber || orderId}`
    )
    .run();

  await issueEarnedCoupons(userId, orderId, orderNumber);
}

/**
 * Issue any coupon milestones newly unlocked by the user's current balance.
 *
 * Coupons already issued are counted (used or not) so a redeemed coupon can
 * never be re-issued for the same 100-point block.
 */
async function issueEarnedCoupons(
  userId: string,
  orderId: string | null,
  orderNumber?: string
): Promise<void> {
  const db = getDB();
  const user = await db
    .prepare("SELECT points FROM users WHERE id = ?")
    .bind(userId)
    .first<any>();
  if (!user) return;

  const milestonesUnlocked = Math.floor(user.points / COUPON_POINT_THRESHOLD);
  if (milestonesUnlocked <= 0) return;

  const { results: existing } = await db
    .prepare("SELECT COUNT(*) as c FROM coupons WHERE user_id = ?")
    .bind(userId)
    .all<any>();
  const owed = milestonesUnlocked - (existing[0]?.c || 0);

  for (let i = 0; i < owed; i++) {
    const code = await generateCouponCode();
    await db
      .prepare(
        "INSERT INTO coupons (id, branch_id, user_id, code, amount, is_used) VALUES (?, ?, ?, ?, ?, 0)"
      )
      .bind(`cpn-${Date.now()}-${i}`, "default-branch", userId, code, COUPON_VALUE_KYAT)
      .run();
    await db
      .prepare(
        "INSERT INTO loyalty_events (id, branch_id, user_id, order_id, points_earned, coupon_code, reason) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        `loy-cpn-${Date.now()}-${i}`,
        "default-branch",
        userId,
        orderId,
        0,
        code,
        `Coupon issued for ${COUPON_POINT_THRESHOLD}-point milestone`
      )
      .run();
  }
}

/**
 * Validate a coupon code for a user and return its value in kyat, or null if
 * the code is unknown, already used, expired, or belongs to another user.
 */
export async function validateCoupon(
  userId: string | undefined,
  code: string | null | undefined
): Promise<{ code: string; amount: number } | null> {
  if (!userId || !code) return null;
  const row = await getDB()
    .prepare(
      "SELECT code, amount, is_used, expires_at FROM coupons WHERE UPPER(code) = UPPER(?) AND user_id = ? LIMIT 1"
    )
    .bind(code.trim(), userId)
    .first<any>();
  if (!row || row.is_used) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
  return { code: row.code, amount: row.amount };
}

/** Mark a coupon as spent. Callers must only call this after a successful sale. */
export async function redeemCoupon(userId: string, code: string): Promise<void> {
  await getDB()
    .prepare("UPDATE coupons SET is_used = 1 WHERE UPPER(code) = UPPER(?) AND user_id = ?")
    .bind(code.trim(), userId)
    .run();
  await getDB()
    .prepare(
      "INSERT INTO loyalty_events (id, branch_id, user_id, points_redeemed, coupon_code, reason) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      `loy-redeem-${Date.now()}`,
      "default-branch",
      userId,
      COUPON_POINT_THRESHOLD,
      code.trim(),
      `Redeemed coupon ${code.trim()}`
    )
    .run();
}

/** Coupons still available to spend for a user. */
export async function listActiveCoupons(userId: string): Promise<any[]> {
  const { results } = await getDB()
    .prepare(
      `SELECT id, code, amount, expires_at, created_at FROM coupons
       WHERE user_id = ? AND is_used = 0
         AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY created_at DESC`
    )
    .bind(userId, new Date().toISOString())
    .all<any>();
  return results.map((c: any) => ({
    id: c.id,
    code: c.code,
    amount: c.amount,
    expiresAt: c.expires_at,
    createdAt: c.created_at,
  }));
}

export async function getRoyalCustomers(filters?: { minSpend?: number; minPoints?: number; search?: string; tier?: string }): Promise<any[]> {
  const { results } = await getDB()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.points, u.total_spent, u.created_at,
              (SELECT COUNT(*) FROM coupons c WHERE c.user_id = u.id) AS coupon_count,
              (SELECT COUNT(*) FROM coupons c WHERE c.user_id = u.id AND c.is_used = 0) AS active_coupon_count,
              (SELECT COALESCE(SUM(o.total), 0)
                 FROM orders o WHERE o.user_id = u.id AND o.payment_status = 'paid') AS verified_spent,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.payment_status = 'paid') AS paid_orders,
              (SELECT MAX(o.created_at) FROM orders o WHERE o.user_id = u.id) AS last_order_at
       FROM users u
       WHERE u.role = 'customer' AND u.is_active = 1
       ORDER BY verified_spent DESC, u.points DESC`
    )
    .all<any>();

  let rows = results.map((r: any) => {
    const points = r.points || 0;
    const verifiedSpent = r.verified_spent || 0;
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      points,
      // Real money: the settled order totals, which already reflect any coupon
      // discount (a discounted order stores the reduced total).
      verifiedSpent,
      // Stand-in for pre-seeded balances not backed by real orders.
      seededSpent: Math.max(0, (r.total_spent || 0) - verifiedSpent),
      paidOrders: r.paid_orders || 0,
      couponCount: r.coupon_count || 0,
      activeCouponCount: r.active_coupon_count || 0,
      tier: tierForPoints(points),
      lastOrderAt: r.last_order_at || null,
      createdAt: r.created_at,
    };
  });

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }
  if (filters?.minPoints) {
    rows = rows.filter((r) => r.points >= filters.minPoints!);
  }
  if (filters?.minSpend) {
    rows = rows.filter((r) => r.verifiedSpent >= filters.minSpend!);
  }
  if (filters?.tier) {
    rows = rows.filter((r) => r.tier === filters.tier);
  }
  return rows;
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

// Per-dish status transitions.
//
// A dish moves pending -> accepted -> preparing -> plating -> ready under the
// kitchen's control, then ready -> served under the waiter's control, because
// serving is the moment a waiter carries it to the table. The kitchen therefore
// cannot mark a dish served, and the waiter cannot advance a dish through the
// kitchen's stages — the split is enforced here, not just hidden in the UI.
export const DISH_STATUS_FLOW: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["plating", "cancelled"],
  plating: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  cancelled: [],
};

/** Transitions the kitchen may drive. `served` is deliberately absent. */
export const KITCHEN_ITEM_FLOW: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["plating", "cancelled"],
  plating: ["ready", "cancelled"],
};

/** Transitions the waiter may drive. Only handing a ready dish over. */
export const WAITER_ITEM_FLOW: Record<string, string[]> = {
  ready: ["served"],
};

/**
 * Order status is now derived from its dishes rather than set directly.
 *
 * Previously the order was the source of truth and every item was bulk-synced
 * to the same status. That cannot express "the starter has gone out but the
 * main is still cooking", which is the normal case for a table order. The
 * order status is the least-advanced status among its live dishes, so it always
 * reflects the dish still holding the table up.
 */
const STATUS_PRECEDENCE = [
  "cancelled",
  "pending",
  "accepted",
  "preparing",
  "plating",
  "ready",
  "served",
];

/** Recompute and persist an order's status from its dishes. */
export async function recomputeOrderStatus(orderId: string): Promise<string | null> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT status FROM order_items WHERE order_id = ?")
    .bind(orderId)
    .all<any>();
  if (!results || results.length === 0) return null;

  const live = results.map((r: any) => r.status).filter((s: string) => s !== "cancelled");
  if (live.length === 0) return "cancelled";

  const derived =
    STATUS_PRECEDENCE.find((s) => live.includes(s)) ?? "pending";

  const current = await db
    .prepare("SELECT status FROM orders WHERE id = ?")
    .bind(orderId)
    .first<any>();
  // A settled or cancelled order is terminal; service states must not reopen it.
  if (current && (current.status === "completed" || current.status === "cancelled")) {
    return current.status;
  }

  if (current && current.status !== derived) {
    await db
      .prepare(
        `UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(derived, orderId)
      .run();
    await db
      .prepare(
        `UPDATE kitchen_orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE order_id = ?`
      )
      .bind(derived, orderId)
      .run();
    await notifyRealtime({ type: "orders", orderId });
  }
  return derived;
}

/**
 * Move a single dish through its status flow.
 *
 * `flow` is chosen by the caller so the kitchen and the waiter each get only the
 * transitions they own. Serving stamps `served_at`, which is what makes the
 * ordered -> served duration measurable.
 */
export async function updateOrderItemStatus(
  itemId: string,
  status: string,
  flow: Record<string, string[]>,
  servedBy?: string
): Promise<any | null> {
  const db = getDB();
  const item = await db
    .prepare("SELECT id, status, order_id FROM order_items WHERE id = ?")
    .bind(itemId)
    .first<any>();
  if (!item) return null;

  const allowed = flow[item.status] || [];
  if (!allowed.includes(status)) return null;

  const now = new Date().toISOString();
  if (status === "served") {
    await db
      .prepare(
        `UPDATE order_items SET status = ?, served_at = ?, served_by = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`
      )
      .bind(status, now, servedBy || null, itemId)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE order_items SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(status, itemId)
      .run();
  }

  await recomputeOrderStatus(item.order_id);
  await notifyRealtime({ type: "orders", orderId: item.order_id, itemId });

  return db
    .prepare("SELECT * FROM order_items WHERE id = ?")
    .bind(itemId)
    .first<any>();
}

/** Bulk-advance every unserved dish on an order (used by the kitchen board). */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<any> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, status FROM order_items WHERE order_id = ?")
    .bind(id)
    .all<any>();
  if (!results || results.length === 0) return null;

  let moved = 0;
  for (const item of results) {
    if (await updateOrderItemStatus(item.id, status, KITCHEN_ITEM_FLOW)) moved++;
  }
  if (moved === 0) return null;

  return db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<any>();
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
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
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
    // Compute elapsed from created_at so refetches resume from a real baseline
    // instead of resetting to the stored counter.
    elapsed: Math.max(
      0,
      Math.floor((Date.now() - new Date(o.created_at).getTime()) / 1000)
    ),
    createdAt: o.created_at,
    items: grouped[o.order_id] || [],
  }));
}

export async function createKitchenOrder(data: any): Promise<any> {
  void data.orderId;
  void data.id;
  const orderNumber =
    data.orderNumber ||
    (await nextUniqueNumber("order", "orders", "order_number", (n) => `#${n}`));
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
  const [resRows, orderRows, kitchenRow, revenueRow, recentOrders, coversRow, receiptsRow] =
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
      getDB()
        .prepare("SELECT COUNT(*) as c FROM receipts WHERE created_at >= ?")
        .bind(today + "T00:00:00")
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
    todayReceipts: receiptsRow?.c || 0,
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

// ---- Receipts (POS — E-receipts & physical receipts) ----
export async function createReceipt(data: any): Promise<any> {
  const year = new Date().getFullYear();
  const receiptNo =
    data.receiptNo ||
    (await nextUniqueNumber("receipt", "receipts", "receipt_no", (n) =>
      `R-${year}-${String(n).padStart(4, "0")}`
    ));
  const id = data.id || `rec-${generateToken().slice(0, 8)}`;
  await getDB()
    .prepare(
      `INSERT INTO receipts (id, branch_id, receipt_no, order_id, order_number, customer_name, table_number, subtotal, tax, service_charge, total, payment_method, receipt_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      "default-branch",
      receiptNo,
      data.orderId || null,
      data.orderNumber || "",
      data.customerName || "Guest",
      data.tableNumber || null,
      parseInt(data.subtotal) || 0,
      parseInt(data.tax) || 0,
      parseInt(data.serviceCharge) || 0,
      parseInt(data.total) || 0,
      data.paymentMethod || "cash",
      data.receiptType || "e",
      data.createdBy || ""
    )
    .run();
  await notifyRealtime({ type: "receipts" });
  return getReceipt(id);
}

/**
 * POS checkout — one atomic D1 batch: paid+completed order, its items, and the
 * receipt. If any statement fails nothing is written (no orphaned paid orders).
 * Completed sales skip the kitchen queue (no `kitchen_orders` row, items are
 * `served` immediately) and the receipt number is generated from the `receipt`
 * counter inside the same call as the batch (self-seeding via nextCounter).
 */
export async function createPaidSale(data: any): Promise<{
  order: any;
  receipt: any;
}> {
  const id = data.id || `ord-${generateToken().slice(0, 8)}`;
  const orderNumber =
    data.orderNumber ||
    (await nextUniqueNumber("order", "orders", "order_number", (n) => `#${n}`));
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

  const grossSubtotal = validatedItems.reduce(
    (s: number, it: any) => s + it.price * it.quantity,
    0
  );
  const now = new Date().toISOString();

  // Resolve and apply a coupon discount BEFORE totals are finalised, so tax,
  // service charge, the receipt and the loyalty points all reflect the amount
  // the guest actually pays.
  let discount = 0;
  let appliedCoupon: { code: string; amount: number } | null = null;
  if (data.couponCode && data.userId) {
    appliedCoupon = await validateCoupon(data.userId, data.couponCode);
    if (!appliedCoupon) {
      throw new Error("Invalid, expired or already-used coupon code");
    }
    // Never discount past zero.
    discount = Math.min(appliedCoupon.amount, grossSubtotal);
  }

  const subtotal = Math.max(0, grossSubtotal - discount);
  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  const order = {
    id,
    orderNumber,
    tableId: data.tableId,
    tableNumber: data.tableNumber || null,
    items: validatedItems.map((it: any) => ({ ...it, status: "served" })),
    subtotal,
    discount,
    couponCode: appliedCoupon?.code ?? null,
    tax,
    serviceCharge,
    total,
    status: "completed",
    paymentStatus: "paid",
    specialInstructions: data.specialInstructions || "",
    createdAt: now,
    updatedAt: now,
  };

  const year = new Date().getFullYear();
  const receiptNo = await nextUniqueNumber(
    "receipt",
    "receipts",
    "receipt_no",
    (n) => `R-${year}-${String(n).padStart(4, "0")}`
  );
  const receiptId = data.receiptId || `rec-${generateToken().slice(0, 8)}`;
  const receipt = {
    id: receiptId,
    receiptNo,
    orderId: id,
    orderNumber,
    customerName: data.customerName || "Guest",
    tableNumber: data.tableNumber || null,
    subtotal,
    discount,
    tax,
    serviceCharge,
    total,
    paymentMethod: data.paymentMethod || "cash",
    receiptType: data.receiptType || "e",
    createdBy: data.createdBy || "",
    items: validatedItems.map((it: any) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      variants: it.variants,
      addons: it.addons,
    })),
    createdAt: now,
  };

  const db = getDB();
  const statements = [
    db
      .prepare(
        `INSERT INTO orders (id, branch_id, order_number, user_id, table_number, subtotal, tax, service_charge, total, status, payment_status, special_instructions, discount, coupon_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        "default-branch",
        orderNumber,
        data.userId || null,
        order.tableNumber,
        subtotal,
        tax,
        serviceCharge,
        total,
        "completed",
        "paid",
        order.specialInstructions,
        discount,
        appliedCoupon?.code ?? null
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
          "served"
        )
    ),
    db
      .prepare(
        `INSERT INTO receipts (id, branch_id, receipt_no, order_id, order_number, customer_name, table_number, subtotal, tax, service_charge, total, payment_method, receipt_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        receipt.id,
        "default-branch",
        receipt.receiptNo,
        order.id,
        order.orderNumber,
        receipt.customerName,
        order.tableNumber,
        subtotal,
        tax,
        serviceCharge,
        total,
        receipt.paymentMethod,
        receipt.receiptType,
        receipt.createdBy
      ),
  ];

  await db.batch(statements);

  // Loyalty settles AFTER the sale is durably recorded, so a failed batch
  // never mints points. Points accrue on the amount actually paid (any coupon
  // discount is already reflected in `total`).
  if (data.userId) {
    if (appliedCoupon) {
      await redeemCoupon(data.userId, appliedCoupon.code);
    }
    await awardLoyaltyPoints(data.userId, total, id, orderNumber);
  }

  await notifyRealtime({ type: "orders" });
  await notifyRealtime({ type: "receipts" });
  return { order, receipt };
}

/**
 * Settle a table order that a waiter opened.
 *
 * The POS normally *creates* a sale; this settles one that already exists, so a
 * table's bill closes without retyping every dish. The order's stored amounts
 * are authoritative — they were built from the dishes when the waiter ordered,
 * and re-pricing here could disagree with what the guest was quoted.
 */
export async function settleExistingOrder(data: {
  orderId: string;
  paymentMethod?: string;
  receiptType?: string;
  createdBy?: string;
}): Promise<{ order: any; receipt: any }> {
  const db = getDB();
  const order = await db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .bind(data.orderId)
    .first<any>();

  if (!order) throw new Error("Order not found");
  if (order.payment_status === "paid") {
    throw new Error("This table has already been settled");
  }
  if (order.status === "cancelled") {
    throw new Error("This order was cancelled");
  }

  const items = await db
    .prepare(
      `SELECT id, name, quantity, price, variants, addons FROM order_items WHERE order_id = ?`
    )
    .bind(data.orderId)
    .all<any>();

  const settledAt = new Date().toISOString();
  const updated = await db
    .prepare(
      `UPDATE orders SET payment_status = 'paid', status = 'completed',
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ? RETURNING *`
    )
    .bind(data.orderId)
    .first<any>();

  // The kitchen ticket is finished with the bill.
  await db
    .prepare(
      `UPDATE kitchen_orders SET status = 'completed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE order_id = ?`
    )
    .bind(data.orderId)
    .run();

  const receiptNo = await nextUniqueNumber(
    "receipt",
    "receipts",
    "receipt_no",
    (n) => `R-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`
  );
  const receiptId = `rec-${generateToken().slice(0, 8)}`;
  const receipt = {
    id: receiptId,
    receiptNo,
    orderId: data.orderId,
    orderNumber: order.order_number,
    customerName: order.customer_name || "Guest",
    tableNumber: order.table_number,
    subtotal: order.subtotal,
    discount: order.discount || 0,
    tax: order.tax,
    serviceCharge: order.service_charge,
    total: order.total,
    paymentMethod: data.paymentMethod || "cash",
    receiptType: data.receiptType || "e",
    createdBy: data.createdBy || "",
    items: (items.results || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      variants: safeJson(it.variants),
      addons: safeJson(it.addons),
    })),
    createdAt: settledAt,
  };

  await db
    .prepare(
      `INSERT INTO receipts (id, branch_id, receipt_no, order_id, order_number, customer_name, table_number, subtotal, tax, service_charge, total, payment_method, receipt_type, created_by)
       VALUES (?, 'default-branch', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      receipt.id,
      receipt.receiptNo,
      order.id,
      order.order_number,
      receipt.customerName,
      order.table_number,
      order.subtotal,
      order.tax,
      order.service_charge,
      order.total,
      receipt.paymentMethod,
      receipt.receiptType,
      receipt.createdBy
    )
    .run();

  // Table orders are usually walk-ins with no account, so this is a no-op for
  // them — but a table linked to a registered guest still earns Royal points.
  if (order.user_id) {
    await awardLoyaltyPoints(order.user_id, order.total, order.id, order.order_number);
  }

  await notifyRealtime({ type: "orders" });
  await notifyRealtime({ type: "receipts" });
  return { order: updated, receipt };
}

export async function getReceipt(id: string): Promise<any | null> {
  const row = await getDB()
    .prepare("SELECT * FROM receipts WHERE id = ?")
    .bind(id)
    .first<any>();
  if (!row) return null;
  let items: any[] = [];
  if (row.order_id) {
    const { results } = await getDB()
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .bind(row.order_id)
      .all<any>();
    items = results.map((it: any) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      variants: safeJson(it.variants),
      addons: safeJson(it.addons),
    }));
  }
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    tableNumber: row.table_number,
    subtotal: row.subtotal,
    tax: row.tax,
    serviceCharge: row.service_charge,
    total: row.total,
    paymentMethod: row.payment_method,
    receiptType: row.receipt_type,
    createdBy: row.created_by,
    createdAt: row.created_at,
    items,
  };
}

export async function listReceipts(
  opts: { limit?: number; from?: string } = {}
): Promise<any[]> {
  const limit = opts.limit || 100;
  let sql = "SELECT * FROM receipts";
  const params: any[] = [];
  if (opts.from) {
    sql += " WHERE created_at >= ?";
    params.push(opts.from);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const { results } = await getDB().prepare(sql).bind(...params).all<any>();
  return results.map((r: any) => ({
    id: r.id,
    receiptNo: r.receipt_no,
    orderId: r.order_id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    tableNumber: r.table_number,
    total: r.total,
    paymentMethod: r.payment_method,
    receiptType: r.receipt_type,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

// ---- Sales report (revenue + receipts by day / week / month) ----
export type SalesPeriod = "daily" | "weekly" | "monthly";

// Buckets use the UTC date portion of stored timestamps (all writes are UTC ISO).
function salesBucketKey(dateStr: string, period: SalesPeriod): string {
  const day = dateStr.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (period === "daily") return day;
  if (period === "weekly") {
    const dow = dt.getUTCDay();
    const diff = (dow + 6) % 7; // days since Monday
    return new Date(Date.UTC(y, m - 1, d - diff)).toISOString().slice(0, 10);
  }
  return day.slice(0, 7); // YYYY-MM
}

const SALES_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SALES_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function salesLabel(key: string, period: SalesPeriod): string {
  const [y, m, d] = key.split("-").map(Number);
  if (period === "daily") {
    const dt = new Date(Date.UTC(y, m - 1, d));
    return `${SALES_DAYS[dt.getUTCDay()]} ${d}`;
  }
  if (period === "weekly") {
    const dt = new Date(Date.UTC(y, m - 1, d));
    return `${SALES_MONTHS[dt.getUTCMonth()]} ${d}`;
  }
  return SALES_MONTHS[m - 1];
}

function buildSalesBuckets(period: SalesPeriod): string[] {
  const keys: string[] = [];
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === "daily") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayUTC.getTime() - i * 86400000);
      keys.push(d.toISOString().slice(0, 10));
    }
    return keys;
  }
  if (period === "weekly") {
    const dow = todayUTC.getUTCDay();
    const thisMonday = new Date(todayUTC.getTime() - ((dow + 6) % 7) * 86400000);
    for (let i = 3; i >= 0; i--) {
      const d = new Date(thisMonday.getTime() - i * 7 * 86400000);
      keys.push(d.toISOString().slice(0, 10));
    }
    return keys;
  }
  // monthly — last 6 months including current
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

export async function getSalesReport(period: SalesPeriod = "daily"): Promise<any> {
  const buckets = buildSalesBuckets(period);
  const firstKey = buckets[0];
  const fromPrefix = period === "monthly" ? firstKey : firstKey;

  const [receipts, paidOrders] = await Promise.all([
    getDB()
      .prepare("SELECT created_at, total FROM receipts WHERE created_at >= ?")
      .bind(fromPrefix)
      .all<any>(),
    getDB()
      .prepare("SELECT created_at, total, payment_status FROM orders WHERE created_at >= ? AND payment_status = 'paid'")
      .bind(fromPrefix)
      .all<any>(),
  ]);

  const bucketMap: Record<string, { revenue: number; receipts: number; orders: number }> = {};
  for (const key of buckets) {
    bucketMap[key] = { revenue: 0, receipts: 0, orders: 0 };
  }
  const rows = receipts.results || [];
  for (const r of rows) {
    const key = salesBucketKey(r.created_at, period);
    if (bucketMap[key]) {
      bucketMap[key].revenue += r.total || 0;
      bucketMap[key].receipts += 1;
    }
  }
  const orderRows = paidOrders.results || [];
  for (const o of orderRows) {
    const key = salesBucketKey(o.created_at, period);
    if (bucketMap[key]) bucketMap[key].orders += 1;
  }

  const data = buckets.map((key) => ({
    key,
    label: salesLabel(key, period),
    ...bucketMap[key],
  }));

  const revenue = data.reduce((s, b) => s + b.revenue, 0);
  const receiptCount = data.reduce((s, b) => s + b.receipts, 0);
  const orders = data.reduce((s, b) => s + b.orders, 0);
  return {
    period,
    buckets: data,
    totals: {
      revenue,
      receipts: receiptCount,
      orders,
      averageRevenue: data.length ? Math.round(revenue / data.length) : 0,
      averageReceipts: data.length ? +(receiptCount / data.length).toFixed(1) : 0,
    },
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