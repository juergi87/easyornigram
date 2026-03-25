# Organigramm

A lightweight, local-first org chart web application — built for self-hosted deployment on a Raspberry Pi 5 or any Linux server in a LAN environment.

---

## Features

- **Visual org chart editor** — drag & drop nodes, connect them with edges to build hierarchies
- **Rich node content** — each node holds a title, department, employee list, and free-text notes
- **Collapsible nodes** — collapse subtrees to keep large charts readable
- **Auto-layout** — one-click Reingold-Tilford tree layout
- **Multiple projects** — manage several org charts independently
- **Read-only viewer** — share a public, non-editable view with your team
- **PIN-protected editor** — single editor PIN, stored only on the server
- **Dark & light mode** — system preference detection + manual toggle
- **Export to PNG** — capture the current viewport as an image
- **Export to PDF** — print-optimized A4/A3 export via jsPDF
- **JSON backup** — export and re-import any project as a portable JSON file
- **Persistent storage** — SQLite database, no external services required
- **Docker deployment** — single Alpine-based container, minimal footprint

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, shadcn/ui |
| Graph     | ReactFlow 11                            |
| Backend   | Node.js, Express                        |
| Database  | SQLite (better-sqlite3)                 |
| Container | Docker, Alpine Linux                    |

---

## Quick Start with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/juergi87/easyornigram
cd easyornigram
```

### 2. Create an environment file

```bash
cp .env.example .env
```

Edit `.env` and set your editor PIN:

```env
EDITOR_PIN=your-secret-pin
```

> **Important:** Choose a PIN that is not trivially guessable. This is the only credential protecting the editor.

### 3. Start the application

```bash
docker compose up -d
```

The app is now available at **http://localhost:3001** (or replace `localhost` with your server's LAN IP).

### 4. Stop the application

```bash
docker compose down
```

---

## Environment Variables

| Variable          | Default                    | Description                              |
|-------------------|----------------------------|------------------------------------------|
| `EDITOR_PIN`      | `1234`                     | PIN required to access the editor        |
| `PORT`            | `3001`                     | Port the server listens on               |
| `NODE_ENV`        | `production`               | Node environment                         |
| `FRONTEND_ORIGIN` | `http://localhost:5173`    | CORS origin (dev only)                   |
| `DATA_DIR`        | `./data`                   | Directory where the SQLite database lives |

---

## Data Persistence

The SQLite database is stored in the `./data/` directory and mounted as a Docker volume:

```yaml
volumes:
  - ./data:/app/data
```

Back up the entire `data/` folder to preserve all org charts. You can also use the built-in **JSON export** to create portable backups of individual projects.

---

## Custom Port

To run on a different port, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:3001"   # host:container
environment:
  - PORT=3001
```

---

## Development Setup

Prerequisites: Node.js 18+

```bash
# Install all dependencies
npm run install:all

# Start backend (port 3001) and frontend dev server (port 5173) in separate terminals
npm run dev:backend
npm run dev:frontend
```

Frontend dev server proxies API calls to the backend automatically.

```bash
# Build frontend for production
npm run build

# Run production build locally (serves frontend + API on port 3001)
npm start
```

---

## Security Notes

- Designed for **LAN / trusted network** use only — do not expose directly to the internet without additional hardening (reverse proxy, TLS, firewall rules).
- The editor PIN is stored only in the server environment and never sent to the browser.
- Auth state is managed via HTTP-only session cookies.
- Unauthenticated users can access the viewer but cannot create or modify org charts.

---

## License

MIT
