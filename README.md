<<<<<<< HEAD
# TaskFlow — Trello-like Project Management App

A full-featured Trello clone built with Node.js, Express, React, and SQLite. Supports boards, lists, cards with drag-and-drop, labels, checklists, board member invitations, and activity logs.

## Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Backend    | Node.js · Express · TypeScript              |
| ORM        | Prisma (SQLite — zero config)               |
| Auth       | JWT (jsonwebtoken) · bcrypt                 |
| Validation | Zod                                         |
| Frontend   | React 18 · TypeScript · Vite                |
| Styling    | Tailwind CSS                                |
| Data       | TanStack Query (react-query)                |
| Drag & Drop| @dnd-kit/core + @dnd-kit/sortable           |
| Testing    | Jest · Supertest (backend) · Vitest (frontend) |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

No Docker, no PostgreSQL, no external services required.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd trello-clone

# Install all dependencies (backend + frontend)
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# The defaults work out of the box — no changes needed for local dev
```

### 3. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Seed the database (optional but recommended)

```bash
cd backend
npm run seed
```

This creates two demo users and sample boards:

| Email               | Password    |
|---------------------|-------------|
| juan@example.com    | password123 |
| bob@example.com     | password123 |

### 5. Start the app

In two separate terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Running tests

```bash
cd backend
npm test
```

For coverage report:

```bash
npm run test:coverage
```

Tests cover: auth (register, login, /me), board CRUD + member management, list CRUD, card CRUD + move, labels, and checklists.

## Project structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Demo data
│   ├── src/
│   │   ├── controllers/       # Route handlers (auth, boards, lists, cards)
│   │   ├── middleware/        # JWT auth, error handler
│   │   ├── routes/            # Express routers
│   │   ├── lib/prisma.ts      # Shared Prisma client
│   │   └── index.ts           # App factory + server entry
│   └── tests/                 # Jest + Supertest integration tests
└── frontend/
    └── src/
        ├── api/               # Axios API clients (auth, boards, lists, cards)
        ├── components/        # Navbar, ListColumn, CardItem, CardModal
        ├── contexts/          # AuthContext (JWT session)
        ├── pages/             # Login, Register, Home, Board
        └── types/             # Shared TypeScript interfaces
```

## API overview

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/boards
POST   /api/boards
GET    /api/boards/:id
PATCH  /api/boards/:id
DELETE /api/boards/:id
POST   /api/boards/:id/members
DELETE /api/boards/:id/members/:userId

GET    /api/boards/:boardId/lists
POST   /api/boards/:boardId/lists
PATCH  /api/boards/:boardId/lists/reorder
PATCH  /api/boards/:boardId/lists/:id
DELETE /api/boards/:boardId/lists/:id

GET    /api/lists/:listId/cards
POST   /api/lists/:listId/cards
GET    /api/cards/:id
PATCH  /api/cards/:id
DELETE /api/cards/:id
PATCH  /api/cards/:id/move
POST   /api/cards/:id/labels
DELETE /api/cards/:id/labels/:labelId
POST   /api/cards/:id/checklists
DELETE /api/cards/:id/checklists/:checklistId
POST   /api/cards/:id/checklists/:checklistId/items
PATCH  /api/cards/:id/checklists/:checklistId/items/:itemId
DELETE /api/cards/:id/checklists/:checklistId/items/:itemId
```

## Features

### Core
- [x] User registration / login / logout with JWT session persistence
- [x] Board CRUD with background color selection
- [x] List CRUD with ordering within boards
- [x] Card CRUD with title, description, and due date
- [x] Data persistence via SQLite (Prisma)

### Bonus
- [x] **Drag and drop** — cards across lists, lists within board (@dnd-kit)
- [x] **Card labels** — color-coded tags (add/remove from card modal)
- [x] **Checklists** — create checklists, add/toggle/delete items with progress bar
- [x] **Board member invitations** — invite by email, role management
- [x] **Activity log** — card moves tracked and shown in card detail modal

## Technical decisions

- **SQLite over PostgreSQL** — eliminates infrastructure setup friction for local evaluation. Schema is database-agnostic via Prisma; switching to Postgres requires only a one-line `DATABASE_URL` change.
- **Floating-point positions** — list and card positions use `Float` to allow insertions without re-indexing all siblings (same approach as Jira/Linear).
- **Optimistic UI for drag-and-drop** — list/card state is mirrored locally during a drag and synced to the server on `dragEnd`, giving instant visual feedback.
- **Factory function for Express app** — `createApp()` in `src/index.ts` makes the app importable in tests without starting a server, enabling clean integration tests.
- **Zod for input validation** — validation errors are caught by the global error handler and returned with structured field-level messages.
=======
# spm_trello_like_app
>>>>>>> 1daa958b52f8f374f89759984c1ae711a74e4cad
