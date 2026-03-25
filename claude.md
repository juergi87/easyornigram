# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Organigramm** is a lightweight, local-first org chart web application designed for Raspberry Pi 5 deployment in a LAN environment. Focus: performance, simplicity, maintainability.

## Core Principles

- Keep the system lightweight — Pi 5 optimized, low memory usage, fast startup
- Prefer simple solutions; avoid overengineering and premature abstraction
- Minimize dependencies; no external services or APIs
- Build incrementally — ensure core works before adding features

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Graph:** ReactFlow 11 only
- **Backend:** Node.js + Express
- **Database:** SQLite via better-sqlite3 (synchronous driver)
- **Deployment:** Single Alpine-based Docker container

## Development Commands

Run from repo root:

```bash
npm run install:all      # Install all dependencies (use --legacy-peer-deps for frontend)
npm run dev:backend      # Backend in watch mode (port 3001)
npm run dev:frontend     # Vite dev server (port 5173)
npm run build            # Build frontend to frontend/dist
npm start                # Production: serves built frontend + API on port 3001
```

```bash
docker compose up --build   # Build and run containerized app
```

There are no automated tests in this project.

## Environment Variables

Copy `.env.example` to `.env`:
- `EDITOR_PIN` — PIN for editor authentication (never expose to frontend)
- `PORT` — backend port (default: 3001)
- `FRONTEND_ORIGIN` — CORS origin for dev (default: `http://localhost:5173`)
- `DATA_DIR` — SQLite database directory (default: `./data`)

## Architecture

### Backend (`backend/src/`)

Express API on port 3001. In production also serves built frontend as static files.

- `index.js` — server setup: CORS, cookie session, static serving, route mounting
- `auth.js` — PIN auth with rate limiting (10 attempts / 15 min window)
- `projects.js` — project and graph CRUD, JSON export/import
- `db.js` — SQLite init with WAL mode and foreign keys enabled

**API routes:**
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/status`
- `GET|POST /api/projects/` — list or create (create requires auth)
- `GET|PUT|DELETE /api/projects/:id` — write ops require auth
- `PUT /api/projects/:id/graph` — save full graph state (nodes + edges)
- `GET /api/projects/:id/export` — JSON export
- `POST /api/projects/import` — JSON import (auth required)

**Database schema:**
```
projects (id, name, created_at, updated_at)
nodes    (id, project_id, title, department, employees JSON, notes, position_x, position_y, collapsed)
edges    (id, project_id, source, target)
```

`employees` is stored as a JSON string in SQLite, not a separate table. Cascading deletes remove nodes/edges when a project is deleted.

**Graph save strategy:** `PUT /api/projects/:id/graph` is a full atomic replace — it deletes all existing nodes/edges for the project and re-inserts the full set in a single SQLite transaction. There is no diff or partial update.

### Frontend (`frontend/src/`)

React 18 SPA. Routing is state-based in `App.jsx` (no React Router).

- `App.jsx` — manages `currentView` state: `home` | `login` | `editor` | `viewer`
- `api/client.js` — unified fetch wrapper for all backend calls
- `pages/` — `HomePage`, `LoginPage`, `EditorPage`, `ViewerPage`
- `components/` — ReactFlow graph editor, node types, toolbars
- `lib/utils.js` — `DEPARTMENTS` array (default dept labels/colors); `lib/layout.js` — Reingold-Tilford tree layout
- `lib/` — export (PNG/PDF via html2canvas + jsPDF), auto-layout, theme, toast

Frontend uses `@` as a path alias for `src/` (e.g. `@/components/ui/button`).

**localStorage keys:** `organigramm_departments` (custom dept labels/colors), `theme` (`dark`|`light`).

### Authentication Model

Single global PIN stored in `EDITOR_PIN` env var, never sent to the frontend. Auth state is an HTTP-only cookie session. Unauthenticated users can view (`/view`) but not edit or create.

## UI / UX Rules

- 8px spacing system
- Dark + light mode support
- Minimal UI — readability over decoration, no heavy animations
- Responsive (mobile / tablet / desktop)

## Anti-patterns

- No microservices, no external DBs, no cloud dependencies
- No complex state managers (no Redux, Zustand, etc.)
- No feature bloat — scope is defined above and should not expand without reason
- No unnecessary re-renders or heavy libraries

## Output Policy

- Output ONLY code and required files.
- Do NOT explain what you are doing.
- Do NOT summarize changes.
- Do NOT describe architecture decisions.
- Do NOT provide step-by-step reasoning.

## Response Format

- When generating code:
  - Provide only the necessary files.
  - No commentary outside of file content.
  - No markdown explanations unless required for file structure.

- If a step is complete:
  - Either output nothing extra OR a single short line: "done"
