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

function createSeededDB(): MockDB {
  return {
    users: [...seedUsers],
    sessions: {},
    reservations: Object.fromEntries(seedReservations.map((r) => [r.id, r])),
    orders: {},
    resCounter: 100,
    orderCounter: 1000,
  };
}

const memoryDB = createSeededDB();

export async function readDB(): Promise<MockDB> {
  return memoryDB;
}

export async function writeDB(db: MockDB): Promise<void> {
  void db;
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