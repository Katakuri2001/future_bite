export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  openingHours: OpeningHours[];
  isOpen: boolean;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceModifier: number;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  experience: TableExperience;
  status: TableStatus;
  location: string;
}

export type TableExperience = "window" | "bar" | "private" | "patio" | "main";
export type TableStatus = "available" | "reserved" | "seated" | "waiting" | "cleaning";

export interface Reservation {
  id: string;
  confirmationCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableId: string;
  tableNumber: number;
  experience: TableExperience;
  specialRequests: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  specialInstructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variants: string[];
  addons: string[];
  specialInstructions: string;
  status: ItemStatus;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "plating"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export type ItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variants: string[];
  addons: { name: string; price: number }[];
  specialInstructions: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin" | "manager" | "kitchen" | "waiter" | "host";
  phone?: string;
  createdAt: string;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber: number;
  items: KitchenOrderItem[];
  priority: "normal" | "urgent" | "delayed";
  status: OrderStatus;
  elapsed: number;
  createdAt: string;
}

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  status: ItemStatus;
  specialInstructions: string;
}

export interface FloorPlanTable {
  id: string;
  number: number;
  capacity: number;
  experience: TableExperience;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  currentReservation?: {
    id: string;
    guestName: string;
    partySize: number;
    time: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  cost: number;
  supplier: string;
  status: "healthy" | "low" | "critical";
  lastUpdated: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "kitchen" | "waiter" | "host";
  phone: string;
  isActive: boolean;
  shift?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  avatarUrl?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  category: "restaurant" | "food" | "kitchen" | "atmosphere" | "chef";
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
