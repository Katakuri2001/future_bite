import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type MockRole = "admin" | "manager" | "kitchen" | "customer";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: MockRole;
  password: string;
  phone: string;
  createdAt: string;
}

export interface MockReservation {
  id: string;
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber: number;
  experience: string;
  specialRequests: string;
  status: string;
  createdAt: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  tableId: string;
  tableNumber: number;
  items: any[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: string;
  paymentStatus: string;
  specialInstructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockDB {
  users: MockUser[];
  sessions: Record<string, string>;
  reservations: Record<string, MockReservation>;
  orders: Record<string, MockOrder>;
  resCounter: number;
  orderCounter: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const inMemoryOnly =
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.NETLIFY) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
let memoryDB: MockDB | null = null;

const seedUsers: MockUser[] = [
  {
    id: "user-admin",
    email: "admin@futurebite.com",
    name: "Alex Kim",
    role: "admin",
    password: "admin123",
    phone: "+95 9 100 100 100",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-manager",
    email: "manager@futurebite.com",
    name: "Maya Thompson",
    role: "manager",
    password: "manager123",
    phone: "+95 9 300 300 300",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-kitchen",
    email: "kitchen@futurebite.com",
    name: "Chef Nakamura",
    role: "kitchen",
    password: "kitchen123",
    phone: "+95 9 200 200 200",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-customer",
    email: "guest@futurebite.com",
    name: "Guest",
    role: "customer",
    password: "guest123",
    phone: "+95 9 000 000 000",
    createdAt: new Date().toISOString(),
  },
];

const seedReservations: MockReservation[] = [
  {
    id: "res-seed-1",
    confirmationCode: "FB-2026-0001",
    customerName: "Sarah Chen",
    customerEmail: "sarah@email.com",
    customerPhone: "+95 9 111 111 111",
    date: "2026-09-10",
    time: "19:30",
    partySize: 2,
    tableNumber: 1,
    experience: "window",
    specialRequests: "",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "res-seed-2",
    confirmationCode: "FB-2026-0002",
    customerName: "James Patel",
    customerEmail: "james@email.com",
    customerPhone: "+95 9 222 222 222",
    date: "2026-09-10",
    time: "20:00",
    partySize: 4,
    tableNumber: 4,
    experience: "main",
    specialRequests: "Window seat preferred",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
];

function createEmptyDB(): MockDB {
  return {
    users: [...seedUsers],
    sessions: {},
    reservations: {},
    orders: {},
    resCounter: 100,
    orderCounter: 1000,
  };
}

function createSeededDB(): MockDB {
  const db = createEmptyDB();
  seedReservations.forEach((r) => {
    db.reservations[r.id] = r;
  });
  return db;
}

async function ensureDBFile(): Promise<MockDB> {
  if (inMemoryOnly) {
    if (!memoryDB) memoryDB = createSeededDB();
    return memoryDB;
  }
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    const db = { ...createEmptyDB(), ...parsed };
    if (!Array.isArray(db.users) || db.users.length === 0) {
      db.users = [...seedUsers];
    }
    return db;
  } catch {
    const db = createSeededDB();
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8").catch(() => {});
    return db;
  }
}

export async function readDB(): Promise<MockDB> {
  return ensureDBFile();
}

export async function writeDB(db: MockDB): Promise<void> {
  if (inMemoryOnly) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Read-only filesystem (e.g. serverless): data lives in memory for the
    // lifetime of the function instance. Mutations still apply to `db`.
  }
}

export function generateToken(): string {
  return randomUUID().replace(/-/g, "");
}

export function sanitizeUser(user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export const DEMO_ACCOUNTS = seedUsers.map((u) => ({
  email: u.email,
  password: u.password,
  role: u.role,
  name: u.name,
}));