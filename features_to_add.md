# Features to Add

## Core Feature Requirements

### 1. Reservation System Improvements
- **Fix table assignment**: ReservationFlow should respect the `tableId` sent by the client and not override server-assigned `tableNumber`.
- **Proper confirmation handling**: On successful reservation, display a valid confirmation code instead of fabricated ones (e.g., `FB-{year}-{rand4}`).
- **Add to Calendar integration**: Implement functional "Add to Calendar" button that creates a calendar event link.
- **Double-booking prevention**: Client-side validation to prevent duplicate reservations for the same party.

### 2. Footer & Navigation
- **Implement all dead footer links**:
  - `/gift-cards` – Add gift card purchase flow
  - `/events` – Event listing and registration
  - `/contact` – Contact form and business info
  - `/careers` – Careers page with job listings
  - `/press` – Press releases and media coverage
  - `/privacy` – Privacy policy page
  - `/about#chef` – Chef biography section
  - `/about#gallery` – Gallery page with featured images
- **Fix dead links in Layout**: Ensure all anchor links in `Footer.tsx` resolve to valid routes.

### 3. Location & Map Integration
- **Replace placeholder map** in `Location.tsx` with actual interactive map (Google Maps / Mapbox) using the restaurant's coordinates.
- **Show operating hours** dynamically from the database instead of hardcoded values.
- **Add directions** using Google Maps API or similar.

### 4. Dynamic Content & Data
- **Remove hardcoded menu items**: Fetch dishes from `menuItems` table in the database.
- **Dynamic table availability**: Show real-time table availability based on booking data.
- **Live reservation counter**: Display current number of active reservations.
- **Personalized recommendations**: Suggest dishes based on user preferences or past orders.

### 5. Authentication & Authorization
- **Secure the `/account` page**: Add proper auth guards so users can only access their own profile and settings.
- **Role-based access control**: Different views for customers, managers, and admins.
- **Login flow improvements**: Clear distinction between demo credentials and real user accounts.

### 6. Performance & UX
- **Lazy-load menu categories**: Load menu sections on demand to improve initial load time.
- **Optimize animation components**: Ensure all unused motion components are either removed or properly integrated.
- **Reduce redundant code**: Consolidate duplicated logic (e.g., Hero timeline, navigation) into reusable hooks.

### 7. Error Handling & User Feedback
- **Improve error messaging**: Provide clear, actionable error messages for failed reservations, invalid inputs, and system errors.
- **Loading states**: Show appropriate loading indicators during API calls.
- **Validation**: Client-side validation for forms (reservations, login, etc.).

### 8. Accessibility
- **ARIA labels** for interactive elements (buttons, modals, maps).
- **Keyboard navigation** support for all major components.
- **Contrast and font sizing** compliant with WCAG standards.

## Summary
These features address critical bugs, improve user experience, and bring the application closer to a fully functional restaurant management system with reliable reservations, dynamic content, and complete navigation.
