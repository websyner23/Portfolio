# WebSyner Platform

A monorepo containing the WebSyner public website, a company admin panel, and the API that powers both.

```
Portfolio/
├── frontend/   Next.js 16 · React 19 · Tailwind v4   → http://localhost:3000
├── admin/      Vite · React 18 · Ant Design 5        → http://localhost:5173
├── backend/    Express 4 · Mongoose 8 · TypeScript   → http://localhost:5000
└── package.json (orchestration only)
```

---

## Quick start

```bash
# 1. Install dependencies for all three apps
npm run install:all

# 2. Configure the backend
#    Copy backend/.env.example → backend/.env and set DATABASE_URL to your
#    MongoDB Atlas connection string. (See "Database" below to run offline.)

# 3. Seed roles, the super admin, and all website content
npm run seed

# 4. Start everything with one command
npm run dev
```

Then open:

| App | URL | Login |
|---|---|---|
| Website | http://localhost:3000 | — |
| Admin panel | http://localhost:5173 | `admin@websyner.co` / `admin12345` |
| API | http://localhost:5000/api/v1/health | — |

> Change the seeded admin password after the first login (Profile → Change password).

### Root scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts backend, frontend and admin together |
| `npm run dev:backend` / `dev:frontend` / `dev:admin` | Start one app |
| `npm run dev:db` | Optional local MongoDB (see below) |
| `npm run install:all` | Installs dependencies in all three apps |
| `npm run seed` | Seeds roles, super admin and website content (idempotent) |
| `npm run build` | Production build of all three apps |
| `npm test` | Backend test suite |

**Do not run `npm install` at the repo root for app dependencies.** The frontend uses React 19 and the admin uses React 18 (required by Ant Design 5 and react-quill). There are deliberately no npm workspaces, so each app keeps its own `node_modules`.

### Database

The project targets **MongoDB Atlas** — put your connection string in `backend/.env` as `DATABASE_URL`.

To work offline before that is set up, run a local MongoDB in a second terminal:

```bash
npm run dev:db      # real mongod on :27017, data persisted to backend/.mongo-data
```

The API starts listening immediately even when the database is unreachable, and retries the connection in the background — so a bad connection string shows a clear log message rather than a hang.

---

## Backend

Express + Mongoose + TypeScript, organised in a **modules** structure.

```
backend/src/
├── app.ts / server.ts       express app, http server, socket.io, graceful shutdown
├── config/                  single typed export of every env var
├── app/
│   ├── builder/             QueryBuilder — search / filter / sort / paginate / fields
│   ├── errors/              AppError + zod, cast, duplicate, validation handlers
│   ├── middlewares/         auth(...permissions), validateRequest(zod),
│   │                        globalErrorHandler, notFound
│   ├── utils/               catchAsync, sendResponse, crudFactory, QueryBuilder helpers,
│   │                        jwt, sendEmail, upload (multer→Cloudinary), revalidate
│   ├── routes/              aggregates every module router under /api/v1
│   └── modules/<name>/      <name>.interface|model|validation|service|controller|route.ts
├── socket/                  socket.io server + emit helpers
├── seeds/                   seed.ts + migrated website content
└── scripts/                 dev-db.ts, extract-content.ts
```

Every response uses the same envelope:

```jsonc
{ "success": true, "statusCode": 200, "message": "…", "meta": {…}, "data": {…} }
```

List endpoints accept `?searchTerm=&page=&limit=&sort=&fields=` plus any model field as a filter, and return `meta: { page, limit, total, totalPage }`.

### Testing the API

- **`backend/requests/*.http`** — one file per module for the VS Code REST Client extension. Run the *Login* request first; the token is chained automatically into the rest.
- **`npm test`** — Jest + Supertest against an in-memory MongoDB. Covers login, refresh, RBAC denial, permission catalog, role CRUD, QueryBuilder pagination/search, audit trail, and the 404 handler.

---

## Admin panel

Vite + React 18 + Ant Design 5, with RTK Query for data and `redux-persist` for the session.

- **Routing and the sidebar are generated from one file**: `admin/src/routes/routeConfig.tsx`. Each entry carries a `permission`; menu items and routes the user can't access are filtered out automatically.
- **Auth**: access token in the `Authorization` header (15 min), refresh token in an httpOnly cookie (30 days). A 401 triggers a transparent refresh-and-retry before logging the user out.
- **Theme**: light/dark via Ant Design's algorithm, persisted per user.
- **Responsive**: the sidebar collapses to a drawer under `lg`, and tables scroll horizontally.

### Modules currently available

| Section | What you can do |
|---|---|
| Dashboard | Landing page (summary widgets pending) |
| Website → Site settings | Brand, contact details, socials, navigation, SEO, logos |
| Website → Theme & colours | Every brand colour for light and dark mode |
| Website → Page content | Headlines, intro copy and CTAs for all 7 pages |
| Website → Services | Full service records incl. outcomes, deliverables, process, FAQs |
| Website → Portfolio | Case studies with cover image, gallery, metrics, tags, live/prototype URL |
| Website → Categories, Testimonials, Team, Pricing, Extras, Comparison, FAQs, Process, Stats | Full CRUD for every content list on the site |
| Leads | Pipeline for contact and quote submissions — status, internal notes, search, filters, stat cards |
| Meetings | Confirm, reschedule and cancel bookings; each change emails the visitor |
| Users | Create/edit/block admin accounts, reset passwords |
| Roles & Permissions | Dynamic roles with a permission matrix |
| Audit Log | Every action with user, device, browser, OS, IP and timestamp |

A bell in the header shows realtime notifications. When a visitor submits a form or books a call, connected admins get a toast immediately and the relevant tables refresh themselves — no reload needed.

---

## How website content works

All website content lives in MongoDB and is edited from the admin panel.

1. **Reads** — the frontend fetches from the public API (`/api/v1/public/*`) through `frontend/src/lib/api.ts`, cached for 5 minutes with cache tags.
2. **Writes** — saving anything in the admin panel makes the backend call the frontend's `/api/revalidate` webhook, which expires the affected tags so the change appears within seconds.
3. **Fallback** — if the API is unreachable, pages fall back to the original static content in `frontend/src/data/*.ts`, so the site never breaks.

Two constraints shaped the data model:

- **Icons are stored as names** (`"Layout"`), not React components, and resolved through `frontend/src/lib/icon-map.ts`. Keep it in sync with `ICON_OPTIONS` in `admin/src/pages/cms/ContentPages.tsx`.
- **Colours are stored as hex values**, never Tailwind class strings — Tailwind only generates classes it can see in the source at build time, so a class name coming from the database would be stripped. Theme colours are injected as CSS variables in the root layout; portfolio gradients render as inline styles.

To re-import content from the static data files after editing them:

```bash
npm --prefix backend run extract:content && npm run seed
```

Seeding is idempotent — it never duplicates records and never overwrites content you have edited in the admin panel.

---

## Environment variables

**`backend/.env`** (see `.env.example`)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Change these before deploying |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Used once by the seeder |
| `CLOUDINARY_*` | Required for image uploads in the admin panel |
| `SMTP_*`, `EMAIL_FROM` | Email. Without these, messages are logged to the console instead of sent |
| `FRONTEND_URL` / `ADMIN_URL` | CORS whitelist and email links |
| `REVALIDATE_SECRET` | Must match the frontend's value |
| `COMPANY_TZ` | Timezone for attendance and scheduled jobs (`Asia/Dhaka`) |

**`frontend/.env.local`** — `API_URL`, `NEXT_PUBLIC_API_URL`, `REVALIDATE_SECRET`
**`admin/.env`** — `VITE_API_URL`, `VITE_SOCKET_URL`

---

## Realtime

Socket.io connects the admin panel to the API. The access token is verified on the handshake and re-sent on reconnect, so a rotated token never leaves a stale session open. Admins with `dashboard.view` join an `admins` room and receive:

| Event | Fired when |
|---|---|
| `lead.new` | A visitor submits the contact or quote form |
| `meeting.new` | A visitor books a call |
| `meeting.upcoming` | A confirmed meeting starts within the hour (cron) |

The public website never opens a socket — form posts on the website trigger the notifications server-side.

## Scheduled jobs

`node-cron`, all scheduled in `COMPANY_TZ`:

| Schedule | Job |
|---|---|
| every 15 min | Email reminders for confirmed meetings starting within the hour (sent once per meeting) |

---

## Project status

**Working end to end:** monorepo tooling · authentication with refresh tokens · dynamic roles and permissions · audit logging with device details · the full website CMS · media uploads · the public content API · the website reading its content, colours and navigation from the database · the rebuilt portfolio with shareable URL filters, search and case-study detail pages · all three website forms (contact, hero quote, meeting booking) submitting for real · the leads pipeline · meeting management with visitor emails · realtime admin notifications.

**Not yet built:**

- Attendance and HRM (employees, punch panel, monthly reports)
- Payroll and finance (accounts, transactions, receivables, salary ledger)
- HR document generator (offer, promotion and resignation letters)
- Project management with realtime chat
- Dashboard widgets and charts (the dashboard page is currently a placeholder)

Most website section components still read from `frontend/src/data/*.ts` rather than the API. The pages, layout, navigation, theme, services, FAQs, portfolio and all three forms are converted; the remaining presentational sections continue to work from the static files and can be migrated the same way (accept a prop, default to the static export, fetch in the page).
