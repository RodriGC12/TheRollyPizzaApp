# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paris Rolly Pizza is a full-stack restaurant management system. It has two independent Node.js packages:
- `backend/` — Express REST API with PostgreSQL
- `frontend/` — React 19 SPA with Vite and Tailwind CSS v4

## Commands

Run from each respective directory:

**Backend** (`cd backend`):
```bash
npm run dev    # Development (nodemon)
npm start      # Production
```

**Frontend** (`cd frontend`):
```bash
npm run dev    # Vite dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Architecture

### Backend

Entry point `src/index.js` mounts seven route groups under `/api/`: `auth`, `ordenes`, `productos`, `usuarios`, `caja`, `menu`, `mesas`.

Layers:
- **Config** (`src/config/db.js`): PostgreSQL connection pool via `pg`
- **Middleware** (`src/middleware/auth.js`): Validates JWT Bearer tokens; attach to any protected route
- **Controllers** (`src/controllers/`): All business logic and SQL queries live here
- **Routes** (`src/routes/`): Thin Express router files that wire URLs to controllers

Backend requires a `.env` file with: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT`.

### Frontend

Entry point `src/main.jsx` → `src/App.jsx` which defines all React Router routes.

Key files:
- `src/services/api.js`: Axios instance that auto-injects the JWT token from `localStorage` on every request and redirects to `/login` on 401
- `src/pages/`: One file per page (Login, Dashboard, Mesas)
- `src/components/` and `src/context/` exist but are currently empty

### Role-based Access Control

Four roles exist in the database: `Administrador`, `Cajero`, `Mesero`, `Cocina`. The frontend route guard in `App.jsx` checks the role stored in `localStorage` after login and redirects to `/sin-acceso` if unauthorized.

### Database Entities

PostgreSQL tables: `usuarios`, `roles`, `productos`, `categorias_menu`, `ordenes`, `mesas`, `caja`. A view `vw_menu_disponible` exposes the active menu.
