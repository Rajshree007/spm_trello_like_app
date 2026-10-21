# TaskFlow — Trello-like Project Management App

A full-featured Trello clone built with Node.js, Express, React, and SQLite. Supports boards, lists, cards with drag-and-drop, labels, checklists, board member invitations, and activity logs.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma (SQLite — zero configuration) |
| Authentication | JWT (jsonwebtoken), bcrypt |
| Validation | Zod |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Data Fetching | TanStack Query (React Query) |
| Drag and Drop | @dnd-kit/core, @dnd-kit/sortable |
| Testing | Jest, Supertest (backend), Vitest (frontend) |

## Prerequisites

- **Node.js** version 18 or later
- **npm** version 9 or later

No Docker, PostgreSQL, or external services are required.

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Rajshree007/spm_trello_like_app.git
cd spm_trello_like_app
```

### 2. Install dependencies

Install backend dependencies:

```bash
npm install --prefix backend
```

Install frontend dependencies:

```bash
npm install --prefix frontend
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

The default configuration should work for local development. Verify the environment variables if your setup differs.

### 4. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This creates and initializes the SQLite database using the Prisma schema.

### 5. Seed the database (optional)

From the `backend` directory, run:

```bash
npm run seed
```

This creates demo users and sample boards, if the seed script is configured as described below.

| Email | Password |
|---|---|
| juan@example.com | password123 |
| bob@example.com | password123 |

Use these credentials only in a local development environment.

### 6. Start the application

Run the backend and frontend in two separate terminal windows.

**Terminal 1 — Backend**

```bash
cd backend
npm run dev
```

The backend runs on port `3001`, assuming the default configuration.

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

The frontend runs on port `5173`, assuming the default Vite configuration.

Open the application in your browser:

http://localhost:5173

## Running Tests

Run backend tests:

```bash
cd backend
npm test
```

For backend test coverage, if the script is configured:

```bash
npm run test:coverage
```

The documented backend test coverage includes authentication, board operations, board member management, lists, cards, labels, and checklists. Run the test suite to verify the features implemented in your current checkout.

## Project Structure

```text
spm_trello_like_app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   └── index.ts
│   └── tests/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── contexts/
        ├── pages/
        └── types/
```

### Backend

- `prisma/` — Prisma schema, database migrations, and seed data.
- `controllers/` — Handles application business logic.
- `middleware/` — Authentication, request processing, and error handling.
- `routes/` — Defines API endpoints.
- `lib/prisma.ts` — Shared Prisma client.
- `tests/` — Backend integration tests.

### Frontend

- `api/` — API clients for communicating with the backend.
- `components/` — Reusable UI components, such as navigation, lists, cards, and modals.
- `contexts/` — Application-wide state, including authentication.
- `pages/` — Application screens, such as login, registration, home, and boards.
- `types/` — TypeScript interfaces and shared types.

## API Overview

The following endpoints describe the documented API. Availability may depend on the current implementation.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user |

### Boards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | Get accessible boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/:id` | Get board details |
| PATCH | `/api/boards/:id` | Update a board |
| DELETE | `/api/boards/:id` | Delete a board |
| POST | `/api/boards/:id/members` | Add a board member |
| DELETE | `/api/boards/:id/members/:userId` | Remove a board member |

### Lists

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards/:boardId/lists` | Get lists for a board |
| POST | `/api/boards/:boardId/lists` | Create a list |
| PATCH | `/api/boards/:boardId/lists/reorder` | Reorder lists |
| PATCH | `/api/boards/:boardId/lists/:id` | Update a list |
| DELETE | `/api/boards/:boardId/lists/:id` | Delete a list |

### Cards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lists/:listId/cards` | Get cards in a list |
| POST | `/api/lists/:listId/cards` | Create a card |
| GET | `/api/cards/:id` | Get card details |
| PATCH | `/api/cards/:id` | Update a card |
| DELETE | `/api/cards/:id` | Delete a card |
| PATCH | `/api/cards/:id/move` | Move a card |

### Labels and Checklists

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/cards/:id/labels` | Add a label |
| DELETE | `/api/cards/:id/labels/:labelId` | Remove a label |
| POST | `/api/cards/:id/checklists` | Create a checklist |
| DELETE | `/api/cards/:id/checklists/:checklistId` | Delete a checklist |
| POST | `/api/cards/:id/checklists/:checklistId/items` | Add a checklist item |
| PATCH | `/api/cards/:id/checklists/:checklistId/items/:itemId` | Update a checklist item |
| DELETE | `/api/cards/:id/checklists/:checklistId/items/:itemId` | Delete a checklist item |

## Features

### Core Features

- [x] User registration and login with JWT authentication.
- [x] Board creation, viewing, editing, and deletion.
- [x] Board background color selection.
- [x] List creation, editing, deletion, and ordering.
- [x] Card creation, editing, and deletion.
- [x] Card titles, descriptions, and due dates.
- [x] SQLite database persistence through Prisma.

### Additional Features

- [x] **Drag and drop:** Move cards between lists and reorder lists using `@dnd-kit`.
- [x] **Card labels:** Organize cards with color-coded labels.
- [x] **Checklists:** Create checklists, manage items, and track completion progress.
- [x] **Board member invitations:** Invite members by email and manage membership.
- [x] **Activity log:** Track card movements and display activity in card details.
- [x] **Authentication persistence:** Maintain user sessions using JWT-based authentication.

Feature checkboxes reflect the project's intended or documented functionality; verify them against the current codebase.

## Technical Decisions

### SQLite and Prisma

SQLite simplifies local development by avoiding the need to configure a separate database server. Prisma provides database access through a typed schema and migration system.

### TypeScript

TypeScript adds static typing to both the backend and frontend, helping identify errors during development and improving code maintainability.

### JWT Authentication

JSON Web Tokens support authenticated API requests. Password hashing with bcrypt helps protect stored user passwords.

### Zod Validation

Zod validates incoming data and helps return structured validation errors when requests contain invalid input.

### Drag-and-Drop Interface

The `@dnd-kit` libraries support interactive movement and reordering of cards and lists.

### React and Vite

React provides reusable UI components, while Vite supports fast local development and frontend builds.

## Troubleshooting

### Backend dependency errors

From the project root, run:

```bash
npm install --prefix backend
```

### Frontend dependency errors

```bash
npm install --prefix frontend
```

### Database errors

From the backend directory, verify that the environment file exists and run the Prisma migration:

```bash
npx prisma migrate dev
```

### Port already in use

If ports `3001` or `5173` are occupied, stop the conflicting process or configure the application to use different ports.

### API connection errors

Ensure the backend is running and verify the frontend API base URL and backend port.

## Future Improvements

- Add real-time collaboration and notifications.
- Improve search, filtering, and sorting.
- Add additional board permissions and roles.
- Support file attachments on cards.
- Improve accessibility and mobile responsiveness.
- Add CI workflows for automated testing and builds.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit your changes with a descriptive message.
5. Open a pull request.

## License

Add the appropriate license information for this project before distributing it publicly.

---

**TaskFlow** — Organize work, collaborate with teammates, and track progress in one place.
