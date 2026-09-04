// Cloudflare Worker API for Futuristic Restaurant
// Small, self-contained implementation with D1-aware helpers and DEV_DB fallback
import { sign, verify } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import bwipjs from 'bwip-js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const HAS_D1 = typeof DB !== 'undefined' && !!DB // expecting a binding named DB for D1

async function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Simple dev in-memory DB (Maps)
const DEV_DB = {
  users: new Map(),
  dishes: new Map(),
  tables: new Map(),
  bookings: new Map(),
  orders: new Map(),
  order_items: new Map(),
  supplies: new Map(),
  ratings: new Map(),
}

// Seed a couple of tables and dishes for dev
function seedDev() {
  if (DEV_DB.tables.size === 0) {
    for (let i = 1; i <= 10; i++) {
      const id = `table-${i}`
      DEV_DB.tables.set(id, { id, table_number: i, seats: 4, status: 'free' })
    }
  }
  if (DEV_DB.dishes.size === 0) {
    const sample = [
      { name: 'Nebula Salad', price: 1299, points: 10, category: 'starter' },
      { name: 'Quantum Burger', price: 1599, points: 15, category: 'main' },
      { name: 'Solar Fries', price: 499, points: 5, category: 'sides' },
    ]
    for (const d of sample) {
      const id = uuidv4()
      DEV_DB.dishes.set(id, { id, ...d, description: '', available: 1, created_at: new Date().toISOString() })
    }
  }
}
seedDev()

// D1 helper (very small wrapper)
async function d1Run(sql, params = []) {
  if (!HAS_D1) throw new Error('D1 not bound')
  return DB.prepare(sql).bind(...params).all()
}

// Password helpers
async function hashPassword(pw) { const salt = await bcrypt.genSalt(10); return bcrypt.hash(pw, salt) }
async function comparePassword(pw, hash) { return bcrypt.compare(pw, hash) }

function createJWT(payload) { return sign(payload, JWT_SECRET, { expiresIn: '7d' }) }
function verifyJWT(token) { try { return verify(token, JWT_SECRET) } catch (e) { return null } }

// QR / barcode
async function generateQRCodeDataURL(text) { return QRCode.toDataURL(text, { errorCorrectionLevel: 'H' }) }
async function generateBarcodePNG(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({ bcid: 'code128', text, scale: 3, height: 10, includetext: false }, (err, png) => {
      if (err) return reject(err)
      resolve(png)
    })
  })
}

// Basic rate limiter (in-memory)
const RATE = new Map()
function rateCheck(key, max = 400, window = 60_000) {
  const now = Date.now()
  const entry = RATE.get(key) || { count: 0, ts: now }
  if (now - entry.ts > window) { entry.count = 1; entry.ts = now; RATE.set(key, entry); return true }
  entry.count++
  RATE.set(key, entry)
  return entry.count <= max
}

// DB helpers using D1 or DEV_DB
async function dbGetUserByEmail(email) {
  if (HAS_D1) {
    const res = await d1Run('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    return res.results && res.results[0] ? res.results[0] : null
  }
  for (const u of DEV_DB.users.values()) if (u.email === email) return u
  return null
}

async function dbGetUserById(id) {
  if (HAS_D1) {
    const res = await d1Run('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
    return res.results && res.results[0] ? res.results[0] : null
  }
  return DEV_DB.users.get(id) || null
}

async function dbCreateUser(user) {
  if (HAS_D1) {
    await DB.prepare('INSERT INTO users (id,name,email,password_hash,role,barcode,qrcode,points,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(user.id, user.name, user.email, user.password_hash || '', user.role || 'user', user.barcode || null, user.qrcode || null, user.points || 0, user.created_at || new Date().toISOString())
      .run()
    return user
  }
  DEV_DB.users.set(user.id, user)
  return user
}

async function dbListDishes() {
  if (HAS_D1) { const res = await d1Run('SELECT * FROM dishes ORDER BY created_at DESC'); return res.results || [] }
  return Array.from(DEV_DB.dishes.values())
}

async function dbCreateDish(dish) {
  if (HAS_D1) { await DB.prepare('INSERT INTO dishes (id,name,description,price,points,category,image_url,available,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(dish.id, dish.name, dish.description||null, dish.price, dish.points||0, dish.category||null, dish.image_url||null, dish.available||1, dish.created_at||new Date().toISOString()).run(); return dish }
  DEV_DB.dishes.set(dish.id, dish); return dish
}

async function dbGetOrdersForUser(userId, asAdmin = false) {
  if (HAS_D1) {
    if (asAdmin) { const res = await d1Run('SELECT * FROM orders ORDER BY created_at DESC'); return res.results || [] }
    const res = await d1Run('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]); return res.results || []
  }
  if (asAdmin) return Array.from(DEV_DB.orders.values())
  return Array.from(DEV_DB.orders.values()).filter(o => o.user_id === userId)
}

async function dbCreateOrder(order, items = []) {
  if (HAS_D1) {
    await DB.prepare('INSERT INTO orders (id,user_id,table_id,total_amount,status,created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(order.id, order.user_id, order.table_id, order.total_amount, order.status||'pending', order.created_at).run()
    for (const it of items) await DB.prepare('INSERT INTO order_items (id,order_id,dish_id,quantity,price,points) VALUES (?, ?, ?, ?, ?, ?)').bind(it.id, it.order_id, it.dish_id, it.quantity, it.price, it.points||0).run()
    return order
  }
  DEV_DB.orders.set(order.id, order)
  for (const it of items) DEV_DB.order_items.set(it.id, it)
  return order
}

// WebSocket management (in-memory) — recommend Durable Objects for production
const WS_CLIENTS = new Map()
function registerWSClient(id, socket, meta = {}) { WS_CLIENTS.set(id, { socket, ...meta }) }
function unregisterWSClient(id) { WS_CLIENTS.delete(id) }
function broadcastToAdmins(msg) { for (const c of WS_CLIENTS.values()) if (c.role === 'admin' && c.socket && c.socket.readyState === WebSocket.OPEN) try { c.socket.send(JSON.stringify(msg)) } catch(e){} }
function broadcastToTable(tableId, msg) { for (const c of WS_CLIENTS.values()) if (c.tableId === tableId && c.socket && c.socket.readyState === WebSocket.OPEN) try { c.socket.send(JSON.stringify(msg)) } catch(e){} }

function broadcastOrderUpdate(order) { broadcastToAdmins({ type: 'order:update', order }); if (order.table_id) broadcastToTable(order.table_id, { type: 'order:update', order }) }

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

addEventListener('scheduled', ev => {
  // scheduled tasks placeholder
  console.log('scheduled event', ev)
})

async function handleRequest(req) {
  const url = new URL(req.url)
  const path = url.pathname

  // rate limit by ip
  try { const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'local'; if (!rateCheck(ip)) return jsonResponse({ error: 'rate_limited' }, 429) } catch(e){}

  // health
  if (path === '/api/health') return jsonResponse({ ok: true })

  // Auth: signup
  if (path === '/api/auth/signup' && req.method === 'POST') {
    const body = await req.json()
    const { name, email, password } = body
    if (!name || !email || !password) return jsonResponse({ error: 'missing_fields' }, 400)
    const existing = await dbGetUserByEmail(email)
    if (existing) return jsonResponse({ error: 'email_exists' }, 409)
    const id = uuidv4(); const password_hash = await hashPassword(password)
    const qr_plain = `user:${id}:${Date.now()}`
    const qrcode = await generateQRCodeDataURL(qr_plain)
    const barcodeBuf = await generateBarcodePNG(qr_plain); const barcode_b64 = 'data:image/png;base64,' + Buffer.from(barcodeBuf).toString('base64')
    const user = { id, name, email, password_hash, role: 'user', qrcode, barcode: barcode_b64, points: 0, created_at: new Date().toISOString() }
    await dbCreateUser(user)
    const token = createJWT({ sub: id, role: 'user' })
    return jsonResponse({ user: { id, name, email, qrcode, barcode: barcode_b64 }, token })
  }

  // Auth: login
  if (path === '/api/auth/login' && req.method === 'POST') {
    const body = await req.json(); const { email, password } = body
    if (!email || !password) return jsonResponse({ error: 'missing_fields' }, 400)
    const found = await dbGetUserByEmail(email)
    if (!found) return jsonResponse({ error: 'invalid_credentials' }, 401)
    const ok = await comparePassword(password, found.password_hash)
    if (!ok) return jsonResponse({ error: 'invalid_credentials' }, 401)
    const token = createJWT({ sub: found.id, role: found.role })
    return jsonResponse({ user: { id: found.id, name: found.name, email: found.email, points: found.points||0 }, token })
  }

  // me
  if (path === '/api/me' && req.method === 'GET') {
    const auth = req.headers.get('Authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    const payload = verifyJWT(token)
    if (!payload) return jsonResponse({ error: 'unauthorized' }, 401)
    const user = await dbGetUserById(payload.sub)
    if (!user) return jsonResponse({ error: 'not_found' }, 404)
    return jsonResponse({ user: { id: user.id, name: user.name, email: user.email, points: user.points||0, role: user.role||payload.role } })
  }

  // Dishes
  if (path === '/api/dishes') {
    if (req.method === 'GET') {
      const list = await dbListDishes()
      return jsonResponse({ dishes: list })
    }
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '')
      const payload = verifyJWT(token)
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401)
      const body = await req.json(); if (!body.name || body.price == null) return jsonResponse({ error: 'missing_fields' }, 400)
      const dish = { id: uuidv4(), name: body.name, description: body.description||'', price: Number(body.price), points: body.points||0, category: body.category||'main', image_url: body.image_url||null, available: body.available||1, created_at: new Date().toISOString() }
      await dbCreateDish(dish)
      return jsonResponse({ dish }, 201)
    }
  }

  if (path.startsWith('/api/dishes/')) {
    const id = path.split('/').pop()
    if (req.method === 'GET') {
      let dish = null
      if (HAS_D1) { const res = await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [id]); dish = res.results && res.results[0] ? res.results[0] : null } else dish = DEV_DB.dishes.get(id)
      if (!dish) return jsonResponse({ error: 'not_found' }, 404)
      return jsonResponse({ dish })
    }
    const auth = req.headers.get('Authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    const payload = verifyJWT(token)
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401)
    if (req.method === 'PUT') {
      const body = await req.json(); // simple replace fields
      if (HAS_D1) { const fields = []; const vals = []; for (const k of ['name','description','price','points','category','image_url','available']) if (k in body) { fields.push(`${k} = ?`); vals.push(body[k]) }; if (fields.length) { vals.push(id); await DB.prepare(`UPDATE dishes SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run() }; const res = await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [id]); return jsonResponse({ dish: res.results && res.results[0] ? res.results[0] : null }) }
      const d = DEV_DB.dishes.get(id); if (!d) return jsonResponse({ error: 'not_found' }, 404); const updated = { ...d, ...body }; DEV_DB.dishes.set(id, updated); return jsonResponse({ dish: updated })
    }
    if (req.method === 'DELETE') {
      if (HAS_D1) { await DB.prepare('DELETE FROM dishes WHERE id = ?').bind(id).run(); return jsonResponse({ ok: true }) }
      DEV_DB.dishes.delete(id); return jsonResponse({ ok: true })
    }
  }

  // Tables
  if (path === '/api/tables' && req.method === 'GET') {
    const tables = Array.from(DEV_DB.tables.values()).map(t => ({ id: t.id, table_number: t.table_number, seats: t.seats, status: t.status }))
    return jsonResponse({ tables })
  }

  // Bookings
  if (path === '/api/bookings') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '')
      const payload = verifyJWT(token)
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401)
      const body = await req.json(); const { table_id, booking_time } = body
      if (!table_id || !booking_time) return jsonResponse({ error: 'missing_fields' }, 400)
      const id = uuidv4(); const booking = { id, user_id: payload.sub, table_id, booking_time, status: 'booked', created_at: new Date().toISOString() }
      DEV_DB.bookings.set(id, booking)
      const tbl = DEV_DB.tables.get(table_id); if (tbl) tbl.status = 'booked'
      return jsonResponse({ booking }, 201)
    }
    if (req.method === 'GET') {
      return jsonResponse({ bookings: Array.from(DEV_DB.bookings.values()) })
    }
  }

  // Orders
  if (path === '/api/orders') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '')
      const payload = verifyJWT(token)
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401)
      const body = await req.json(); if (!body || !Array.isArray(body.items) || body.items.length === 0) return jsonResponse({ error: 'invalid_payload' }, 400)
      let total = 0; let points = 0; const order_id = uuidv4(); const orderItems = []
      for (const it of body.items) {
        const dish = HAS_D1 ? (await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [it.dish_id])).results[0] : DEV_DB.dishes.get(it.dish_id)
        if (!dish) return jsonResponse({ error: 'dish_not_found', id: it.dish_id }, 400)
        const qty = Number(it.quantity || 1); total += dish.price * qty; points += (dish.points || 0) * qty
        const oi = { id: uuidv4(), order_id, dish_id: dish.id, quantity: qty, price: dish.price, points: dish.points || 0 }
        orderItems.push(oi)
      }
      const order = { id: order_id, user_id: payload.sub, table_id: body.table_id || null, total_amount: total, status: 'pending', created_at: new Date().toISOString() }
      await dbCreateOrder(order, orderItems)
      try { broadcastOrderUpdate(order) } catch (e) {}
      return jsonResponse({ order, pointsEarned: points }, 201)
    }
    if (req.method === 'GET') {
      const auth = req.headers.get('Authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '')
      const payload = verifyJWT(token)
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401)
      const list = await dbGetOrdersForUser(payload.sub, payload.role === 'admin')
      return jsonResponse({ orders: list })
    }
  }

  // Single order get/patch
  if (path.startsWith('/api/orders/') ) {
    const id = path.split('/').pop()
    if (req.method === 'GET') {
      const order = DEV_DB.orders.get(id) || null
      if (!order) return jsonResponse({ error: 'not_found' }, 404)
      const items = Array.from(DEV_DB.order_items.values()).filter(it => it.order_id === id)
      return jsonResponse({ order, items })
    }
    if (req.method === 'PATCH') {
      const auth = req.headers.get('Authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '')
      const payload = verifyJWT(token)
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401)
      const body = await req.json(); if (!body.status) return jsonResponse({ error: 'missing_fields' }, 400)
      const o = DEV_DB.orders.get(id); if (!o) return jsonResponse({ error: 'not_found' }, 404); o.status = body.status; DEV_DB.orders.set(id, o); try { broadcastOrderUpdate(o) } catch(e){}
      return jsonResponse({ order: o })
    }
  }

  // Supplies & ratings & admin analytics / backup endpoints
  if (path === '/api/supplies') {
    if (req.method === 'GET') return jsonResponse({ supplies: Array.from(DEV_DB.supplies.values()) })
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || ''; const token = auth.replace(/^Bearer\s+/i, ''); const payload = verifyJWT(token)
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401)
      const body = await req.json(); if (!body.name) return jsonResponse({ error: 'missing_fields' }, 400)
      const id = uuidv4(); const item = { id, name: body.name, quantity: body.quantity||0, restock_date: body.restock_date||null, price: body.price||0, created_at: new Date().toISOString() }
      DEV_DB.supplies.set(id, item); return jsonResponse({ supply: item }, 201)
    }
  }

  if (path === '/api/ratings' && req.method === 'POST') {
    const body = await req.json(); const rating = Number(body.rating); if (!rating || rating < 1 || rating > 5) return jsonResponse({ error: 'invalid_rating' }, 400)
    const id = uuidv4(); const r = { id, user_id: null, rating, comment: body.comment||'', created_at: new Date().toISOString() }
    DEV_DB.ratings.set(id, r); return jsonResponse({ rating: r }, 201)
  }

  if (path === '/api/admin/analytics' && req.method === 'GET') {
    const auth = req.headers.get('Authorization') || ''; const token = auth.replace(/^Bearer\s+/i, ''); const payload = verifyJWT(token)
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401)
    // top dishes (simple)
    const counts = {}
    for (const it of DEV_DB.order_items.values()) counts[it.dish_id] = (counts[it.dish_id]||0) + it.quantity
    const top = Object.entries(counts).map(([dish_id, sold_count]) => ({ dish_id, sold_count, name: (DEV_DB.dishes.get(dish_id)||{}).name || dish_id })).sort((a,b)=>b.sold_count - a.sold_count).slice(0,10)
    // daily sales
    const daily = {}
    for (const o of DEV_DB.orders.values()) { const d = (o.created_at||'').slice(0,10); daily[d] = (daily[d]||0) + (o.total_amount||0) }
    const dailyArr = Object.entries(daily).map(([date, income]) => ({ date, income }))
    return jsonResponse({ top_dishes: top, daily_sales: dailyArr })
  }

  return new Response('Not Found', { status: 404 })
}
// Cloudflare Worker minimal API scaffold
// Dependencies: bcryptjs, jsonwebtoken, uuid, qrcode, bwip-js

import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Analytics helpers
async function dbTopDishes(limit = 10) {
  if (HAS_D1) {
    const sql = `SELECT oi.dish_id, d.name, SUM(oi.quantity) as sold_count FROM order_items oi LEFT JOIN dishes d ON oi.dish_id = d.id GROUP BY oi.dish_id ORDER BY sold_count DESC LIMIT ?`;
    const res = await d1Run(sql, [limit]);
    return res.results || [];
  }
  // in-memory count
  const counts = {};
  for (const it of DEV_DB.order_items.values()) {
    counts[it.dish_id] = (counts[it.dish_id] || 0) + (it.quantity || 1);
  }
  const arr = Object.entries(counts).map(([dish_id, sold_count]) => ({ dish_id, sold_count, name: (DEV_DB.dishes.get(dish_id)||{}).name || dish_id }));
  arr.sort((a,b)=>b.sold_count - a.sold_count);
  return arr.slice(0, limit);
}

async function dbDailySales(days = 14) {
  if (HAS_D1) {
    const sql = `SELECT substr(created_at,1,10) as date, SUM(total_amount) as income FROM orders GROUP BY date ORDER BY date DESC LIMIT ?`;
    const res = await d1Run(sql, [days]);
    return res.results || [];
  }
  // in-memory aggregate by date YYYY-MM-DD
  const map = {};
  for (const o of DEV_DB.orders.values()) {
    const d = (o.created_at || '').slice(0,10) || new Date(o.created_at).toISOString().slice(0,10);
    map[d] = (map[d] || 0) + (o.total_amount || 0);
  }
  return Object.entries(map).map(([date, income])=>({ date, income }));
}

// Simple in-memory placeholder for development only.
// Replace with D1 queries when binding `D1_DATABASE` in Cloudflare.
const DEV_DB = {
  users: new Map(),
  dishes: new Map(),
  tables: new Map(),
  bookings: new Map(),
  orders: new Map(),
  order_items: new Map(),
  ratings: new Map(),
  supplies: new Map(),
  // Bookings
  if (path === '/api/bookings') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      if (!validateBookingPayload(body)) return jsonResponse({ error: 'invalid_payload' }, 400);
      const { table_id, booking_time } = body;
      const id = uuidv4();
      const booking = { id, user_id: payload.sub, table_id, booking_time, status: 'booked', created_at: new Date().toISOString() };
      await dbCreateBooking(booking);
      // Mark table booked (simple)
      const tbl = DEV_DB.tables.get(table_id);
      if (tbl) tbl.status = 'booked';
      try { scheduleBookingNotification(booking); } catch (e) { console.error('scheduleBookingNotification failed', e); }
      return jsonResponse({ booking }, 201);
    }
    if (req.method === 'GET') {
      // return bookings from D1 or in-memory
      if (HAS_D1) {
        const res = await d1Run('SELECT * FROM bookings ORDER BY booking_time DESC');
        return jsonResponse({ bookings: res.results || [] });
      }
      return jsonResponse({ bookings: Array.from(DEV_DB.bookings.values()) });
    }
  }

  // Orders
  if (path === '/api/orders') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      if (!validateOrderPayload(body)) return jsonResponse({ error: 'invalid_payload' }, 400);
      const { table_id, items } = body; // items: [{dish_id, quantity}]
      let total = 0;
      let pointsEarned = 0;
      const order_id = uuidv4();
      const orderItems = [];
      for (const it of items) {
        const dish = HAS_D1 ? (await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [it.dish_id])).results[0] : DEV_DB.dishes.get(it.dish_id);
        if (!dish) return jsonResponse({ error: 'dish_not_found', id: it.dish_id }, 400);
        const qty = it.quantity || 1;
        total += dish.price * qty;
        pointsEarned += (dish.points || 0) * qty;
        const oi = { id: uuidv4(), order_id, dish_id: dish.id, quantity: qty, price: dish.price, points: dish.points || 0 };
        orderItems.push(oi);
      }
      const order = { id: order_id, user_id: payload.sub, table_id: table_id || null, total_amount: total, status: 'pending', created_at: new Date().toISOString() };
      await dbCreateOrder(order, orderItems);
      try { broadcastOrderUpdate(order); } catch (e) { console.error('broadcast order create error', e); }
      return jsonResponse({ order, pointsEarned }, 201);
    }
    if (req.method === 'GET') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      const list = await dbGetOrdersForUser(payload.sub, payload.role === 'admin');
      return jsonResponse({ orders: list });
    }
  }
  }
  DEV_DB.users.set(user.id, user);
  return user;
}

async function dbCreateBooking(booking) {
  if (HAS_D1) {
    const sql = `INSERT INTO bookings (id, user_id, table_id, booking_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    await DB.prepare(sql).bind(booking.id, booking.user_id, booking.table_id, booking.booking_time, booking.status || 'booked', booking.created_at).run();
    return booking;
  }
  DEV_DB.bookings.set(booking.id, booking);
  return booking;
}

async function dbCreateOrder(order, items = []) {
  if (HAS_D1) {
    const sql = `INSERT INTO orders (id, user_id, table_id, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    await DB.prepare(sql).bind(order.id, order.user_id, order.table_id, order.total_amount, order.status || 'pending', order.created_at).run();
    // insert order items
    for (const it of items) {
      const sql2 = `INSERT INTO order_items (id, order_id, dish_id, quantity, price, points) VALUES (?, ?, ?, ?, ?, ?)`;
      await DB.prepare(sql2).bind(it.id, it.order_id, it.dish_id, it.quantity, it.price, it.points || 0).run();
    }
    return order;
  }
  DEV_DB.orders.set(order.id, order);
  for (const it of items) DEV_DB.order_items.set(it.id, it);
  return order;
}

// Dishes helpers
async function dbCreateDish(dish) {
  if (HAS_D1) {
    const sql = `INSERT INTO dishes (id, name, description, price, points, category, image_url, available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await DB.prepare(sql).bind(dish.id, dish.name, dish.description || null, dish.price, dish.points || 0, dish.category || null, dish.image_url || null, dish.available || 1, dish.created_at).run();
    return dish;
  }
  DEV_DB.dishes.set(dish.id, dish);
  return dish;
}

async function dbUpdateDish(id, patch) {
  if (HAS_D1) {
    // Build simple update (unsafe if many fields) — use explicit fields
    const fields = [];
    const values = [];
    for (const k of ['name','description','price','points','category','image_url','available']) {
      if (k in patch) { fields.push(`${k} = ?`); values.push(patch[k]); }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const sql = `UPDATE dishes SET ${fields.join(', ')} WHERE id = ?`;
    await DB.prepare(sql).bind(...values).run();
    const res = await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [id]);
    return res.results && res.results[0] ? res.results[0] : null;
  }
  const d = DEV_DB.dishes.get(id);
  if (!d) return null;
  const updated = { ...d, ...patch };
  DEV_DB.dishes.set(id, updated);
  return updated;
}

async function dbDeleteDish(id) {
  if (HAS_D1) {
    await DB.prepare('DELETE FROM dishes WHERE id = ?').bind(id).run();
    return true;
  }
  return DEV_DB.dishes.delete(id);
}

async function dbListDishes() {
  if (HAS_D1) {
    const res = await d1Run('SELECT * FROM dishes ORDER BY created_at DESC');
    return res.results || [];
  }
  return Array.from(DEV_DB.dishes.values());
}

// Input validation helpers
function validateDishPayload(body) {
  if (!body) return false;
  if (!body.name || typeof body.name !== 'string') return false;
  if (body.price == null || isNaN(Number(body.price))) return false;
  return true;
}

function validateBookingPayload(body) {
  if (!body) return false;
  if (!body.table_id) return false;
  if (!body.booking_time) return false;
  return true;
}

function validateOrderPayload(body) {
  if (!body) return false;
  if (!Array.isArray(body.items) || body.items.length === 0) return false;
  return true;
}

async function dbGetOrdersForUser(userId, asAdmin = false) {
        if (req.method === 'GET') {
          const list = await dbListDishes();
          return jsonResponse({ dishes: list });
        }
        // Create dish (admin)
        if (req.method === 'POST') {
          const auth = req.headers.get('Authorization') || '';
          const token = auth.replace(/^Bearer\s+/i, '');
          const payload = verifyJWT(token);
          if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
          const body = await req.json();
          const { name, description, price, points = 0, category = 'main', available = 1, image_url } = body;
          if (!name || !price) return jsonResponse({ error: 'missing_fields' }, 400);
          const id = uuidv4();
          const dish = { id, name, description, price, points, category, image_url, available, created_at: new Date().toISOString() };
          await dbCreateDish(dish);
          return jsonResponse({ dish }, 201);
  const o = DEV_DB.orders.get(orderId);
  if (!o) return null;
  o.status = status;
  DEV_DB.orders.set(orderId, o);
  return o;
}

async function hashPassword(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

async function generateQRCodeDataURL(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'H' });
}

async function generateBarcodePNG(text) {
  // Returns PNG Buffer
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: 3,
      height: 10,
      includetext: false
    }, function (err, png) {
      if (err) return reject(err);
      resolve(png);
    });
  });
}

function createJWT(payload) {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJWT(token) {
  try {
    return verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// WebSocket connection management (in-memory). In production, consider Durable Objects.
const WS_CLIENTS = new Map(); // id -> { socket, role, userId, tableId }

function registerWSClient(id, socket, meta = {}) {
  WS_CLIENTS.set(id, { socket, ...meta });
}

function unregisterWSClient(id) {
  WS_CLIENTS.delete(id);
}

function broadcastToAdmins(message) {
  for (const [id, client] of WS_CLIENTS.entries()) {
    if (client.role === 'admin' && client.socket && client.socket.readyState === WebSocket.OPEN) {
      try { client.socket.send(JSON.stringify(message)); } catch (e) { /* noop */ }
    }
  }
}

function broadcastToTable(tableId, message) {
  for (const client of WS_CLIENTS.values()) {
    if (client.tableId === tableId && client.socket && client.socket.readyState === WebSocket.OPEN) {
      try { client.socket.send(JSON.stringify(message)); } catch (e) { /* noop */ }
    }
  }
}

function broadcastOrderUpdate(order) {
  // Send to admins
  broadcastToAdmins({ type: 'order:update', order });
  // Send to connected clients for the table (if any)
  if (order.table_id) broadcastToTable(order.table_id, { type: 'order:update', order });
}

// Booking notification hook (stub). For production, use Cloudflare Scheduled Workers or external job scheduler.
function scheduleBookingNotification(booking) {
  // Placeholder: implement with Durable Objects or external scheduler to notify admin 1 hour before booking_time.
  // Example: enqueue job to worker-queue service or create a cron job entry.
  console.log('scheduleBookingNotification called for', booking.id, booking.booking_time);
}

addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/api/ws') {
    event.respondWith(handleWebSocket(event.request));
    return;
  }
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Rate limit by IP
  try {
    const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || 'local';
    if (!rateCheck(ip, 400, 60_000)) return jsonResponse({ error: 'rate_limited' }, 429);
  } catch (e) { /* ignore */ }

  // Basic routing
  if (path === '/api/health') return jsonResponse({ ok: true });

  if (path === '/api/auth/signup' && req.method === 'POST') {
    const body = await req.json();
    const { name, email, password } = body;
    if (!name || !email || !password) return jsonResponse({ error: 'missing_fields' }, 400);

    // Prevent duplicate accounts
    const existing = await dbGetUserByEmail(email);
    if (existing) return jsonResponse({ error: 'email_exists' }, 409);

    const id = uuidv4();
    const password_hash = await hashPassword(password);
    const qr_plain = `user:${id}:${Date.now()}`;
    const qrcode = await generateQRCodeDataURL(qr_plain);
    const barcodeBuf = await generateBarcodePNG(qr_plain);
    const barcode_b64 = 'data:image/png;base64,' + Buffer.from(barcodeBuf).toString('base64');

    const user = {
      id, name, email, password_hash, role: 'user', qrcode, barcode: barcode_b64, points: 0, created_at: new Date().toISOString()
    };

    await dbCreateUser(user);

    const token = createJWT({ sub: id, role: 'user' });

    return jsonResponse({ user: { id, name, email, qrcode, barcode: barcode_b64 }, token });
  }

  if (path === '/api/auth/login' && req.method === 'POST') {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return jsonResponse({ error: 'missing_fields' }, 400);

    const found = await dbGetUserByEmail(email);
    if (!found) return jsonResponse({ error: 'invalid_credentials' }, 401);
    const ok = await comparePassword(password, found.password_hash);
    if (!ok) return jsonResponse({ error: 'invalid_credentials' }, 401);

    const token = createJWT({ sub: found.id, role: found.role });
    return jsonResponse({ user: { id: found.id, name: found.name, email: found.email }, token });
  }

  // Protected route example
  if (path === '/api/me' && req.method === 'GET') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
    const user = await dbGetUserById(payload.sub);
    if (!user) return jsonResponse({ error: 'not_found' }, 404);
    return jsonResponse({ user: { id: user.id, name: user.name, email: user.email, points: user.points, role: user.role || payload.role } });
  }

  // Dishes: public GET, admin POST/PUT/DELETE
  if (path === '/api/dishes') {
    if (req.method === 'GET') {
      const list = Array.from(DEV_DB.dishes.values());
      return jsonResponse({ dishes: list });
    }
    // Create dish (admin)
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      const id = uuidv4();
      const booking = { id, user_id: payload.sub, table_id, booking_time, status: 'booked', created_at: new Date().toISOString() };
      await dbCreateBooking(booking);
      // Mark table booked (simple)
      const tbl = DEV_DB.tables.get(table_id);
      if (tbl) tbl.status = 'booked';
      // schedule notification (stub)
      try { scheduleBookingNotification(booking); } catch (e) { console.error('scheduleBookingNotification failed', e); }
      return jsonResponse({ booking }, 201);
      DEV_DB.dishes.set(id, dish);
      return jsonResponse({ dish }, 201);
    }
  }

  // Single dish operations
  if (path.startsWith('/api/dishes/') ) {
    const id = path.split('/').pop();
    if (req.method === 'GET') {
      // return single dish
      let dish = null;
      if (HAS_D1) {
        const res = await d1Run('SELECT * FROM dishes WHERE id = ? LIMIT 1', [id]);
        dish = res.results && res.results[0] ? res.results[0] : null;
      } else {
        dish = DEV_DB.dishes.get(id);
      }
      if (!dish) return jsonResponse({ error: 'not_found' }, 404);
      return jsonResponse({ dish });
    }
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
    if (req.method === 'PUT') {
      const body = await req.json();
      const updated = await dbUpdateDish(id, body);
      if (!updated) return jsonResponse({ error: 'not_found' }, 404);
      return jsonResponse({ dish: updated });
    }
    if (req.method === 'DELETE') {
      await dbDeleteDish(id);
      return jsonResponse({ ok: true });
    }
  }

  // Tables list
  if (path === '/api/tables' && req.method === 'GET') {
    const tables = Array.from(DEV_DB.tables.values()).map(t => ({ id: t.id, table_number: t.table_number, seats: t.seats, status: t.status }));
    return jsonResponse({ tables });
  }

  // Bookings
  if (path === '/api/bookings') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      const { table_id, booking_time } = body;
      if (!table_id || !booking_time) return jsonResponse({ error: 'missing_fields' }, 400);
      const id = uuidv4();
      const booking = { id, user_id: payload.sub, table_id, booking_time, status: 'booked', created_at: new Date().toISOString() };
      DEV_DB.bookings.set(id, booking);
      // Mark table booked (simple)
      const tbl = DEV_DB.tables.get(table_id);
      if (tbl) tbl.status = 'booked';
      return jsonResponse({ booking }, 201);
    }
    if (req.method === 'GET') {
      const list = Array.from(DEV_DB.bookings.values());
      return jsonResponse({ bookings: list });
    }
  }

  // Orders
  if (path === '/api/orders') {
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      if (!validateBookingPayload(body)) return jsonResponse({ error: 'invalid_payload' }, 400);
      const { table_id, booking_time } = body;
      const id = uuidv4();
      const booking = { id, user_id: payload.sub, table_id, booking_time, status: 'booked', created_at: new Date().toISOString() };
      await dbCreateBooking(booking);
      // Mark table booked (simple)
      const tbl = DEV_DB.tables.get(table_id);
      if (tbl) tbl.status = 'booked';
      // schedule notification (stub)
      try { scheduleBookingNotification(booking); } catch (e) { console.error('scheduleBookingNotification failed', e); }
      return jsonResponse({ booking }, 201);
        total += dish.price * qty;
        pointsEarned += (dish.points || 0) * qty;
        const oi = { id: uuidv4(), order_id, order_id: order_id, dish_id: dish.id, quantity: qty, price: dish.price, points: dish.points || 0 };
        orderItems.push(oi);
      }
      const order = { id: order_id, user_id: payload.sub, table_id: table_id || null, total_amount: total, status: 'pending', created_at: new Date().toISOString() };
      await dbCreateOrder(order, orderItems);
      // broadcast new order to admins
      try { broadcastOrderUpdate(order); } catch (e) { console.error('broadcast order create error', e); }
      return jsonResponse({ order, pointsEarned }, 201);
    }
    if (req.method === 'GET') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload) return jsonResponse({ error: 'unauthorized' }, 401);
      // Admin: view all orders; user: own orders
      const list = await dbGetOrdersForUser(payload.sub, payload.role === 'admin');
      return jsonResponse({ orders: list });
    }
  }

  // Update order status (admin)
  if (path.startsWith('/api/orders/') && (req.method === 'PATCH' || req.method === 'GET')) {
    const id = path.split('/').pop();
    let order = null;
    let items = [];
    if (HAS_D1) {
      const res = await d1Run('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
      order = res.results && res.results[0] ? res.results[0] : null;
      if (!order) return jsonResponse({ error: 'not_found' }, 404);
      const resItems = await d1Run('SELECT * FROM order_items WHERE order_id = ?', [id]);
      items = resItems.results || [];
    } else {
      order = DEV_DB.orders.get(id);
      if (!order) return jsonResponse({ error: 'not_found' }, 404);
      items = Array.from(DEV_DB.order_items.values()).filter(it => it.order_id === id);
    }
    if (req.method === 'GET') return jsonResponse({ order, items });
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
    const body = await req.json();
    if (body.status) {
      const updated = await dbUpdateOrderStatus(id, body.status);
      try { broadcastOrderUpdate(updated); } catch (e) { console.error('broadcast error', e); }
      return jsonResponse({ order: updated });
    }
    return jsonResponse({ order });
  }

  // Supplies management
  if (path === '/api/supplies') {
    if (req.method === 'GET') {
      if (HAS_D1) {
        const res = await d1Run('SELECT * FROM supplies ORDER BY created_at DESC');
        return jsonResponse({ supplies: res.results || [] });
      }
      return jsonResponse({ supplies: Array.from(DEV_DB.supplies.values()) });
    }
    if (req.method === 'POST') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      const { name, quantity = 0, restock_date = null, price = 0 } = body;
      if (!name) return jsonResponse({ error: 'missing_fields' }, 400);
      const id = uuidv4();
      const item = { id, name, quantity, restock_date, price, created_at: new Date().toISOString() };
      if (HAS_D1) {
        await DB.prepare('INSERT INTO supplies (id, name, quantity, restock_date, price, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(item.id, item.name, item.quantity, item.restock_date, item.price, item.created_at).run();
      } else {
        DEV_DB.supplies.set(id, item);
      }
      return jsonResponse({ supply: item }, 201);
    }
  }

  if (path.startsWith('/api/supplies/') ) {
    const id = path.split('/').pop();
    if (req.method === 'PUT') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
      const body = await req.json();
      if (HAS_D1) {
        const fields = [];
        const vals = [];
        for (const k of ['name','quantity','restock_date','price']) { if (k in body) { fields.push(`${k} = ?`); vals.push(body[k]); } }
        if (fields.length) { vals.push(id); await DB.prepare(`UPDATE supplies SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run(); }
        const res = await d1Run('SELECT * FROM supplies WHERE id = ? LIMIT 1', [id]);
        return jsonResponse({ supply: res.results && res.results[0] ? res.results[0] : null });
      }
      const s = DEV_DB.supplies.get(id);
      if (!s) return jsonResponse({ error: 'not_found' }, 404);
      const updated = { ...s, ...body };
      DEV_DB.supplies.set(id, updated);
      return jsonResponse({ supply: updated });
    }
    if (req.method === 'DELETE') {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\\s+/i, '');
      const payload = verifyJWT(token);
      if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
      if (HAS_D1) {
        await DB.prepare('DELETE FROM supplies WHERE id = ?').bind(id).run();
        return jsonResponse({ ok: true });
      }
      DEV_DB.supplies.delete(id);
      return jsonResponse({ ok: true });
    }
  }

  // Ratings
  if (path === '/api/ratings' && req.method === 'POST') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const payload = verifyJWT(token);
    const body = await req.json();
    const { rating, comment } = body;
    if (!rating || rating < 1 || rating > 5) return jsonResponse({ error: 'invalid_rating' }, 400);
    const id = uuidv4();
    const r = { id, user_id: payload ? payload.sub : null, rating, comment, created_at: new Date().toISOString() };
    DEV_DB.ratings.set(id, r);
    return jsonResponse({ rating: r }, 201);
  }

  // Admin analytics
  if (path === '/api/admin/analytics' && req.method === 'GET') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
    const top = await dbTopDishes(10);
    const daily = await dbDailySales(14);
    return jsonResponse({ top_dishes: top, daily_sales: daily });
  }

  // Admin backup/restore
  if (path === '/api/admin/backup' && req.method === 'GET') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
    if (HAS_D1) {
      // export key tables
      const users = (await d1Run('SELECT * FROM users')).results || [];
      const dishes = (await d1Run('SELECT * FROM dishes')).results || [];
      const orders = (await d1Run('SELECT * FROM orders')).results || [];
      const order_items = (await d1Run('SELECT * FROM order_items')).results || [];
      const bookings = (await d1Run('SELECT * FROM bookings')).results || [];
      return jsonResponse({ users, dishes, orders, order_items, bookings });
    }
    // fallback
    return jsonResponse({ users: Array.from(DEV_DB.users.values()), dishes: Array.from(DEV_DB.dishes.values()), orders: Array.from(DEV_DB.orders.values()), order_items: Array.from(DEV_DB.order_items.values()), bookings: Array.from(DEV_DB.bookings.values()) });
  }

  if (path === '/api/admin/restore' && req.method === 'POST') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\\s+/i, '');
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') return jsonResponse({ error: 'unauthorized' }, 401);
    const body = await req.json();
    if (HAS_D1) {
      // naive restore: insert provided arrays
      for (const u of body.users || []) {
        await DB.prepare('INSERT OR REPLACE INTO users (id, name, email, password_hash, role, barcode, qrcode, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(u.id, u.name, u.email, u.password_hash || '', u.role || 'user', u.barcode || null, u.qrcode || null, u.points || 0, u.created_at || new Date().toISOString()).run();
      }
      for (const d of body.dishes || []) {
        await DB.prepare('INSERT OR REPLACE INTO dishes (id, name, description, price, points, category, image_url, available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(d.id, d.name, d.description || null, d.price || 0, d.points || 0, d.category || null, d.image_url || null, d.available || 1, d.created_at || new Date().toISOString()).run();
      }
      // orders and items omitted for brevity — admins can import via CSV/backup tool
      return jsonResponse({ ok: true });
    }
    // fallback restore into DEV_DB
    for (const u of body.users || []) DEV_DB.users.set(u.id, u);
    for (const d of body.dishes || []) DEV_DB.dishes.set(d.id, d);
    return jsonResponse({ ok: true });
  }

  return new Response('Not Found', { status: 404 });
}

// WebSocket upgrade endpoint
async function handleWebSocket(request) {
  const upgradeHeader = request.headers.get('Upgrade') || '';
  if (upgradeHeader.toLowerCase() !== 'websocket') return new Response('Expected websocket', { status: 400 });

  const { 0: client, 1: server } = new WebSocketPair();
  server.accept();

  // Minimal handshake: expect a query param token and role (admin/table/user)
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const role = url.searchParams.get('role') || 'user';
  const tableId = url.searchParams.get('tableId') || null;
  const payload = token ? verifyJWT(token) : null;

  const clientId = uuidv4();

  registerWSClient(clientId, server, { role, userId: payload ? payload.sub : null, tableId });

  server.addEventListener('message', ev => {
    try {
      const data = JSON.parse(ev.data);
      // Basic ping/pong and echo routes
      if (data.type === 'ping') server.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      // Allow clients to subscribe to a tableId explicitly
      if (data.type === 'subscribe' && data.tableId) {
        const c = WS_CLIENTS.get(clientId);
        if (c) c.tableId = data.tableId;
      }
    } catch (e) { /* ignore malformed */ }
  });

  server.addEventListener('close', () => unregisterWSClient(clientId));

  return new Response(null, { status: 101, webSocket: client });
}
