// Seed 10 demo royal customers with varying points/spent
// Run: npx tsx scripts/seed-royal-users.ts
import { webcrypto } from "crypto";

const demoUsers = [
  { email: "royal1@futurebite.com", name: "Sarah Chen", password: "royal123", points: 450, total_spent: 450000 },
  { email: "royal2@futurebite.com", name: "James Patel", password: "royal123", points: 220, total_spent: 220000 },
  { email: "royal3@futurebite.com", name: "Emily Wong", password: "royal123", points: 150, total_spent: 150000 },
  { email: "royal4@futurebite.com", name: "Michael Ross", password: "royal123", points: 80, total_spent: 80000 },
  { email: "royal5@futurebite.com", name: "Lisa Park", password: "royal123", points: 60, total_spent: 60000 },
  { email: "royal6@futurebite.com", name: "David Kim", password: "royal123", points: 110, total_spent: 110000 },
  { email: "royal7@futurebite.com", name: "Anna Lee", password: "royal123", points: 300, total_spent: 300000 },
  { email: "royal8@futurebite.com", name: "Tom Baker", password: "royal123", points: 40, total_spent: 40000 },
  { email: "royal9@futurebite.com", name: "Nina Garcia", password: "royal123", points: 180, total_spent: 180000 },
  { email: "royal10@futurebite.com", name: "Chris Evans", password: "royal123", points: 95, total_spent: 95000 },
];

async function hashPassword(password: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: 100000 },
    key,
    256
  );
  const hex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:sha256:100000:${saltHex}:${hex}`;
}

async function main() {
  console.log("Demo royal customers (all passwords: royal123):\n");
  for (const u of demoUsers) {
    const hash = await hashPassword(u.password);
    console.log(`INSERT OR IGNORE INTO users (id, branch_id, email, password_hash, first_name, last_name, name, role, phone, is_active, points, total_spent) VALUES ('user-${u.email.split("@")[0]}', 'default-branch', '${u.email}', '${hash}', '${u.name.split(" ")[0]}', '${u.name.split(" ")[1] || ""}', '${u.name}', 'customer', '', 1, ${u.points}, ${u.total_spent});`);
  }
}

main().catch(console.error);
