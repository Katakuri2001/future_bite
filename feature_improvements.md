# Feature Improvements

## 1. Reservation Flow Fixes

### Current Issues
- **Table ID mismatch**: The client sends `tableId` but the API expects `tableNumber` (server-assigned).
- **Fake confirmation codes**: On API failure, the system generates bogus codes (`FB-{year}-{rand4}`) instead of real ones.
- **Broken "Add to Calendar" button**: No click handler; doesn't create actual calendar events.
- **UTC timezone bug**: `ReservationFinder` uses `toISOString().split("T")[0]` which can be off by one day depending on timezone.

### Proposed Improvements
- **Respect server-assigned table numbers**: Remove client-side `tableId` override; trust the server's `tableNumber`.
- **Real confirmation codes**: Generate deterministic codes based on reservation ID (e.g., `RES-{timestamp}-{random}`) or use a proper reservation ID system.
- **Implement calendar integration**: Add a button that creates a Google Calendar event link for the reservation.
- **Fix timezone handling**: Use local time or clearly document the timezone assumption; store dates in ISO 8601 with timezone offset.

## 2. Footer Link Implementation

### Missing Links
| Route | Purpose | Status |
|-------|---------|---------|
| `/gift-cards` | Gift card purchase | ❌ Not implemented |
| `/events` | Event listings | ❌ Not implemented |
| `/contact` | Contact form | ❌ Not implemented |
| `/careers` | Job postings | ❌ Not implemented |
| `/press` | Press releases | ❌ Not implemented |
| `/privacy` | Privacy policy | ❌ Not implemented |
| `/about#chef` | Chef biography | ✅ Partially implemented (hardcoded) |
| `/about#gallery` | Gallery page | ✅ Partially implemented (hardcoded) |

### Improvements
- Create new pages for gift cards, events, contact, and careers.
- Update `Footer.tsx` to point to valid routes.
- Ensure all anchor links resolve to existing pages.

## 3. Location & Map Integration

### Current State
- `Location.tsx` uses a CSS placeholder for the map ("Interactive map coming soon").
- Operating hours are hardcoded.
- No directions or mapping functionality.

### Improvements
- Integrate an interactive map (Google Maps / Mapbox) using the restaurant's geocoordinates.
- Display real-time operating hours from the database.
- Add "Get Directions" button with Google Maps API.
- Show distance/time estimates from the current location.

## 4. Dynamic Content Migration

### Hardcoded Elements to Replace
- **Menu items**: Currently loaded from `src/lib/data.ts` (static array). Should fetch from `menuItems` table.
- **Table availability**: Currently simulated with fake scarcity. Should query actual bookings.
- **Testimonials**: Currently from `data.ts`. Should pull from a testimonials table.
- **Gallery**: Currently hardcoded images. Should use dynamic image selection.
- **Chef bios**: Hardcoded in `ChefSection.tsx`. Should come from a chefs table.
- **Hours**: Hardcoded strings. Should be dynamic from the database.

### Improvements
- Refactor `src/lib/data.ts` to be a data loader that queries the database.
- Create repository functions for menu, tables, reviews, chefs, etc.
- Use TypeScript interfaces for all data entities.

## 5. Authentication & Authorization

### Current State
- `/account` page is a static placeholder with no real auth logic.
- Login page sends all roles (customer, kitchen, manager) to `/admin`.
- Demo credentials are misleading (claim they grant admin access).

### Improvements
- Implement proper JWT-based authentication middleware.
- Protect sensitive pages (`/account`, `/admin`) with role checks.
- Separate customer, staff, and admin views.
- Add proper logout and session management.

## 6. Performance Optimizations

### Unused Components
- `RevealText`, `RevealImage`, `ScrollRevealContainer`, `MotionGrid` are defined but never used.
- `useHeroTimeline()` in `lib/motion/gsap.ts` is duplicated logic not called anywhere.

### Improvements
- Remove unused animation components to reduce bundle size.
- Consolidate repeated hooks (e.g., combine `useReducedMotion` with other motion utilities).
- Implement proper memoization for expensive computations.

## 7. Error Handling & User Experience

### Current Issues
- Fake confirmation codes on API failure.
- No clear error messages for invalid inputs.
- Missing loading states during API calls.

### Improvements
- Centralized error handling with user-friendly messages.
- Loading spinners for all async operations.
- Form validation (required fields, email format, etc.).
- Graceful degradation when services are unavailable.

## 8. Accessibility Enhancements

### Missing Accessibility Features
- Lack of ARIA labels on buttons and interactive elements.
- No keyboard navigation support for modals and dropdowns.
- Insufficient contrast ratios in some UI components.

### Improvements
- Add `aria-label` and `aria-describedby` to all interactive elements.
- Ensure focus is managed properly in modals and dropdowns.
- Verify color contrast meets WCAG AA standards.
- Test with screen readers (NVDA, VoiceOver).

## Priority Summary

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| High | Reservation Flow (table assignment, confirmation codes, calendar) | Critical | Medium |
| High | Footer links (all 7 dead links) | High | Low |
| Medium | Location map integration | Medium | High |
| Medium | Dynamic content migration (menu, tables, reviews) | High | Medium |
| Medium | Authentication & authorization | High | High |
| Low | Unused animation components cleanup | Low | Low |
| Low | Accessibility improvements | Medium | Medium |
