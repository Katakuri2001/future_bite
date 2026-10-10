// Seed 10 demo royal customers with varying points/spent
// Run: npx tsx scripts/seed-royal-users.ts
import { webcrypto } from "crypto";

/**
 * Demo royal customers. `points` is set directly so every tier is represented;
 * the app itself awards 1 point per 10,000 kyat of settled spend, so the
 * `spendKyat` figure is the real-money equivalent of that balance and is only
 * used to keep the seeded figures self-consistent.
 */
const demoUsers = [
  { email: "royal1@futurebite.com",  name: "Sarah Chen",    password: "royal123", points: 450, spendKyat: 4_500_000 },
  { email: "royal2@futurebite.com",  name: "James Patel",   password: "royal123", points: 220, spendKyat: 2_200_000 },
  { email: "royal3@futurebite.com",  name: "Emily Wong",    password: "royal123", points: 150, spendKyat: 1_500_000 },
  { email: "royal4@futurebite.com",  name: "Michael Ross",  password: "royal123", points: 80,  spendKyat: 800_000 },
  { email: "royal5@futurebite.com",  name: "Lisa Park",     password: "royal123", points: 60,  spendKyat: 600_000 },
  { email: "royal6@futurebite.com",  name: "David Kim",     password: "royal123", points: 110, spendKyat: 1_100_000 },
  { email: "royal7@futurebite.com",  name: "Anna Lee",      password: "royal123", points: 300, spendKyat: 3_000_000 },
  { email: "royal8@futurebite.com",  name: "Tom Baker",     password: "royal123", points: 40,  spendKyat: 400_000 },
  { email: "royal9@futurebite.com",  name: "Nina Garcia",   password: "royal123", points: 180, spendKyat: 1_800_000 },
  { email: "royal10@futurebite.com", name: "Chris Evans",   password: "royal123", points: 95,  spendKyat: 950_000 },
];

/** One coupon per 100 points, worth 10,000 kyat. */
const COUPON_POINT_THRESHOLD = 100;
const COUPON_VALUE_KYAT = 10_000;

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
  console.log("-- Demo royal customers. All passwords: royal123\n");
  console.log("-- Balances are seeded directly to exercise every tier; real");
  console.log("-- awards are 1 point per 10,000 kyat settled.\n");

  for (const u of demoUsers) {
    const hash = await hashPassword(u.password);
    const [first, ...rest] = u.name.split(" ");
    const coupons = Math.floor(u.points / COUPON_POINT_THRESHOLD);
    const userId = `user-${u.email.split("@")[0]}`;

    console.log(
      `-- ${u.name} <${u.email}>  ${u.points} pts  ` +
        `${u.spendKyat.toLocaleString()} kyat  ${coupons} coupon(s) @ ${COUPON_VALUE_KYAT.toLocaleString()} kyat`
    );

    console.log(
      `INSERT OR IGNORE INTO users (id, branch_id, email, password_hash, first_name, last_name, name, role, phone, is_active, points, total_spent) ` +
        `VALUES ('${userId}', 'default-branch', '${u.email}', '${hash}', '${first}', '${rest.join(" ")}', '${u.name}', 'customer', '', 1, ${u.points}, ${u.spendKyat});`
    );

    // Backfill the coupons those seeded points entitle them to. Without this the
    // account shows points but an empty coupon wallet.
    for (let i = 0; i < coupons; i++) {
      const code = `ROYAL-${userId.toUpperCase().replace(/-/g, "")}-${i + 1}`;
      console.log(
        `INSERT OR IGNORE INTO coupons (id, branch_id, user_id, code, amount, is_used) ` +
          `VALUES ('cpn-${userId}-${i + 1}', 'default-branch', '${userId}', '${code}', ${COUPON_VALUE_KYAT}, 0);`
      );
    }

    console.log(
      `INSERT OR IGNORE INTO loyalty_events (id, branch_id, user_id, points_earned, reason) ` +
        `VALUES ('loy-seed-${userId}', 'default-branch', '${userId}', ${u.points}, 'Seeded demo balance');`
    );
    console.log("");
  }
}

main().catch(console.error);
