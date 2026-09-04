Frontend setup (React + Vite + Tailwind)

Run these steps to scaffold the frontend app:

```bash
cd frontend
npm create vite@latest web -- --template react
cd web
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# configure tailwind per docs, then run
npm run dev
```

Design guidance: dark mode default, neon accents, glassmorphism, responsive mobile-first.
