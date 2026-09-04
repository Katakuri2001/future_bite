# Enterprise Restaurant Ecosystem - Folder Structure

```
futuristic-restaurant/
├── README.md
├── architecture.md
├── package.json
├── wrangler.toml
├── .gitignore
├── .env.example
│
├── backend/                          # Cloudflare Workers Backend
│   ├── src/
│   │   ├── domains/                  # Domain-Driven Design
│   │   │   ├── auth/                 # Authentication Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   ├── order/                # Order Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   ├── booking/              # Booking Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   ├── loyalty/              # Loyalty Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   ├── inventory/            # Inventory Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   ├── analytics/            # Analytics Domain
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── schemas/
│   │   │   │   └── types.ts
│   │   │   └── research/             # Research Domain
│   │   │       ├── controllers/
│   │   │       ├── services/
│   │   │       ├── repositories/
│   │   │       ├── schemas/
│   │   │       └── types.ts
│   │   ├── core/                     # Core Framework
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   ├── storage/
│   │   │   ├── realtime/
│   │   │   └── config/
│   │   ├── shared/                   # Shared Utilities
│   │   │   ├── validation/
│   │   │   ├── encryption/
│   │   │   ├── qr/
│   │   │   └── constants/
│   │   ├── types/                    # Global Types
│   │   │   ├── api.ts
│   │   │   ├── database.ts
│   │   │   └── events.ts
│   │   ├── middleware/               # Middleware
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── error-handler.ts
│   │   ├── index.ts                  # Main Entry Point
│   │   └── routes.ts                 # Route Definitions
│   ├── tests/                        # Backend Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── package.json
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable Components
│   │   │   ├── ui/                   # UI Components
│   │   │   ├── forms/                # Form Components
│   │   │   ├── layout/               # Layout Components
│   │   │   └── common/               # Common Components
│   │   ├── pages/                    # Page Components
│   │   │   ├── customer/             # Customer Pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Menu.tsx
│   │   │   │   ├── Cart.tsx
│   │   │   │   ├── Orders.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── Booking.tsx
│   │   │   ├── admin/                # Admin Pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Orders.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── Inventory.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   ├── Bookings.tsx
│   │   │   │   └── Research.tsx
│   │   │   └── auth/                 # Auth Pages
│   │   │       ├── Login.tsx
│   │   │       └── Register.tsx
│   │   ├── hooks/                    # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useLoyalty.ts
│   │   │   └── useRealtime.ts
│   │   ├── store/                    # State Management
│   │   │   ├── authStore.ts
│   │   │   ├── orderStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── globalStore.ts
│   │   ├── services/                 # API Services
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── orders.ts
│   │   │   ├── bookings.ts
│   │   │   ├── loyalty.ts
│   │   │   └── analytics.ts
│   │   ├── utils/                    # Utilities
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── qr.ts
│   │   │   └── constants.ts
│   │   ├── types/                    # Frontend Types
│   │   │   ├── api.ts
│   │   │   ├── ui.ts
│   │   │   └── user.ts
│   │   ├── styles/                   # Styles
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── App.tsx                   # Main App Component
│   │   ├── main.tsx                  # Entry Point
│   │   └── vite-env.d.ts
│   ├── public/                       # Static Assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── favicon.ico
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── infra/                            # Infrastructure
│   ├── database/
│   │   ├── schema.sql
│   │   ├── migrations/
│   │   └── seeds/
│   ├── cloudflare/
│   │   ├── wrangler.toml
│   │   ├── workers/
│   │   └── durable-objects/
│   └── deployment/
│       ├── staging/
│       └── production/
│
└── docs/                             # Documentation
    ├── api/                          # API Documentation
    ├── deployment/                   # Deployment Guides
    ├── architecture/                 # Architecture Docs
    └── user-guide/                   # User Guides
```

## Key Principles

### 1. Domain-Driven Design (DDD)
- Each domain is self-contained with its own controllers, services, and repositories
- Clear separation of concerns between business logic and infrastructure
- Type-safe interfaces between domains

### 2. Clean Architecture
- **Presentation Layer**: React components and pages
- **Application Layer**: Controllers and use cases
- **Domain Layer**: Business logic and entities
- **Infrastructure Layer**: Database, cache, external APIs

### 3. Scalability
- Modular structure allows independent scaling of domains
- Cloudflare Workers auto-scale based on demand
- Database sharding ready for multi-tenant expansion

### 4. Security
- Centralized authentication and authorization
- Input validation at multiple layers
- Secure data flow between frontend and backend

### 5. Developer Experience
- Clear folder structure for easy navigation
- Consistent naming conventions
- Type safety throughout the stack

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Services**: camelCase (e.g., `orderService.ts`)
- **Types**: camelCase with `.ts` extension (e.g., `userTypes.ts`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

## Import Patterns

```typescript
// Domain imports
import { OrderService } from '../domains/order/services/orderService';
import { OrderRepository } from '../domains/order/repositories/orderRepository';

// Shared imports
import { validateInput } from '../shared/validation';
import { API_ROUTES } from '../shared/constants';

// Core imports
import { Database } from '../core/database';
import { Cache } from '../core/cache';
```

This structure ensures maintainability, scalability, and clear separation of concerns for the enterprise restaurant ecosystem.
