import { NextResponse } from "next/server";


const menuCategories = [
  { id: "cat-1", name: "Starters", slug: "starters", description: "Begin your journey", displayOrder: 1 },
  { id: "cat-2", name: "Mains", slug: "mains", description: "The heart of the experience", displayOrder: 2 },
  { id: "cat-3", name: "Chef's Selection", slug: "chefs-selection", description: "Curated by our kitchen", displayOrder: 3 },
  { id: "cat-4", name: "Desserts", slug: "desserts", description: "A sweet conclusion", displayOrder: 4 },
  { id: "cat-5", name: "Drinks", slug: "drinks", description: "Crafted beverages", displayOrder: 5 },
];

const menuItems: Record<string, any> = {
  "dish-001": {
    id: "dish-001", name: "Nebula Tartare", slug: "nebula-tartare",
    description: "Hand-cut wagyu beef tartare with black truffle, quail egg yolk, and shaved parmesan crisp.",
    price: 2800, category: "Starters", categorySlug: "starters",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    ingredients: ["Wagyu beef", "Black truffle", "Quail egg", "Parmesan", "Capers", "Shallots"],
    allergens: ["Egg", "Dairy"], dietary: ["Gluten-free"],
    isAvailable: true, isFeatured: true, preparationTime: 15,
  },
  "dish-002": {
    id: "dish-002", name: "Quantum Lobster Bisque", slug: "quantum-lobster-bisque",
    description: "Velvety bisque of Maine lobster, infused with cognac and finished with crème fraîche.",
    price: 2400, category: "Starters", categorySlug: "starters",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    ingredients: ["Maine lobster", "Cognac", "Heavy cream", "Micro herbs", "Crostini"],
    allergens: ["Shellfish", "Dairy", "Gluten"], dietary: [],
    isAvailable: true, isFeatured: false, preparationTime: 12,
  },
  "dish-003": {
    id: "dish-003", name: "Wagyu A5 Omakase", slug: "wagyu-a5-omakase",
    description: "Japanese A5 wagyu strip, charcoal-grilled to perfection.",
    price: 6800, category: "Mains", categorySlug: "mains",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
    ingredients: ["A5 Wagyu strip", "Wasabi", "Ginger", "Seasonal vegetables", "Soy reduction"],
    allergens: ["Soy"], dietary: ["Gluten-free"],
    isAvailable: true, isFeatured: true, preparationTime: 25,
  },
  "dish-004": {
    id: "dish-004", name: "Black Cod Stellaris", slug: "black-cod-stellaris",
    description: "Miso-marinated black cod, slow-roasted for 48 hours.",
    price: 4200, category: "Mains", categorySlug: "mains",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    ingredients: ["Black cod", "White miso", "Dashi", "Shiso", "Yuzu"],
    allergens: ["Fish", "Soy"], dietary: ["Gluten-free"],
    isAvailable: true, isFeatured: true, preparationTime: 20,
  },
  "dish-005": {
    id: "dish-005", name: "Truffle Risotto Cosmos", slug: "truffle-risotto-cosmos",
    description: "Carnaroli rice risotto with black winter truffle, aged parmesan, and truffle oil.",
    price: 3600, category: "Chef's Selection", categorySlug: "chefs-selection",
    imageUrl: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
    ingredients: ["Carnaroli rice", "Black winter truffle", "Parmesan", "Truffle oil"],
    allergens: ["Dairy"], dietary: ["Vegetarian", "Gluten-free"],
    isAvailable: true, isFeatured: true, preparationTime: 22,
  },
  "dish-006": {
    id: "dish-006", name: "Chocolate Eclipse", slug: "chocolate-eclipse",
    description: "Valrhona dark chocolate fondant with a molten center.",
    price: 1800, category: "Desserts", categorySlug: "desserts",
    imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
    ingredients: ["Valrhona chocolate", "Butter", "Eggs", "Vanilla bean", "Gold leaf"],
    allergens: ["Dairy", "Egg", "Gluten"], dietary: [],
    isAvailable: true, isFeatured: true, preparationTime: 18,
  },
  "dish-007": {
    id: "dish-007", name: "Yuzu Panna Cotta Nebula", slug: "yuzu-panna-cotta",
    description: "Silky yuzu-infused panna cotta with matcha crumble.",
    price: 1600, category: "Desserts", categorySlug: "desserts",
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
    ingredients: ["Yuzu", "Cream", "Gelatin", "Matcha", "Candied citrus"],
    allergens: ["Dairy"], dietary: ["Gluten-free"],
    isAvailable: true, isFeatured: false, preparationTime: 10,
  },
  "dish-008": {
    id: "dish-008", name: "FutureBite Signature Cocktail", slug: "signature-cocktail",
    description: "Our signature blend of premium gin, elderflower, butterfly pea flower, and champagne.",
    price: 2200, category: "Drinks", categorySlug: "drinks",
    imageUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80",
    ingredients: ["Premium gin", "Elderflower", "Butterfly pea flower", "Champagne", "Lime"],
    allergens: [], dietary: ["Vegan"],
    isAvailable: true, isFeatured: true, preparationTime: 5,
  },
};

export async function GET() {
  return NextResponse.json({
    categories: menuCategories,
    items: Object.values(menuItems),
  });
}
