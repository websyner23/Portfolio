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
| `npm run stop` | Stops any dev server left running (see below) |
| `npm run dev:backend` / `dev:frontend` / `dev:admin` | Start one app |
| `npm run dev:db` | Optional local MongoDB (see below) |
| `npm run install:all` | Installs dependencies in all three apps |
| `npm run seed` | Seeds roles, super admin and website content (idempotent) |
| `npm run build` | Production build of all three apps |
| `npm test` | Backend test suite |

**Do not run `npm install` at the repo root for app dependencies.** The frontend uses React 19 and the admin uses React 18 (required by Ant Design 5 and react-quill). There are deliberately no npm workspaces, so each app keeps its own `node_modules`.

### "Port 5173 is already in use"

A dev server that didn't shut down cleanly keeps holding its port, and because the three apps run under `concurrently -k`, one port conflict takes the whole stack down. Fix it with:

```bash
npm run stop        # then npm run dev
```

Killing the process on the port by hand usually isn't enough — `ts-node-dev` and `vite` run the real server as a child and respawn it the moment it dies. `npm run stop` walks up to the supervisor and kills the whole tree, and only touches processes belonging to this project.

The ports are deliberately fixed rather than auto-incrementing: the backend's CORS whitelist and the admin's `VITE_API_URL` both assume 5173 and 5000, so silently moving to 5174 would fail later with a confusing CORS error instead of failing fast here.

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
- **`npm test`** — 172 Jest + Supertest tests against an in-memory MongoDB, so they never touch a real database. Eight suites: auth and RBAC, leads and meetings, attendance maths, the attendance flow end to end, finance and payroll, document generation, projects with chat access control, and dashboard permission gating.

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
| Dashboard | Stat cards, leads trend, attendance donut, income vs expenses, upcoming meetings, active projects and recent activity — each widget gated by the viewer's permissions |
| Website → Site settings | Brand, contact details, socials, navigation, SEO, logos |
| Website → Theme & colours | Every brand colour for light and dark mode |
| Website → Page content | Headlines, intro copy and CTAs for all 7 pages |
| Website → Services | Full service records incl. outcomes, deliverables, process, FAQs |
| Website → Portfolio | Case studies with cover image, gallery, metrics, tags, live/prototype URL |
| Website → Categories, Testimonials, Team, Pricing, Extras, Comparison, FAQs, Process, Stats | Full CRUD for every content list on the site |
| Leads | Pipeline for contact and quote submissions — status, internal notes, search, filters, stat cards |
| Meetings | Confirm, reschedule and cancel bookings; each change emails the visitor |
| Attendance → Punch panel | Clock in/out with a live timer for the current shift |
| Attendance → Daily | Per-date sheet with status, first in, last out, work time and lateness; manual finalize |
| Attendance → Monthly | Per-employee and company totals, attendance %, bonus eligibility, payroll, xlsx export |
| Attendance → Employees | Directory, salaries, and linking each employee to a punch-panel login |
| Attendance → Leave | Record and approve leave |
| Attendance → Settings | Shift window, cutoff, grace, required hours, optional days, payroll defaults |
| Finance → Overview | Balances, monthly income vs expenses, 6-month trend chart, income by project |
| Finance → Transactions | Income, expenses and transfers with date-range filters and xlsx export |
| Finance → Pending income | Client receivables; recording a payment books the income automatically |
| Finance → Salary ledger | Payroll generated from attendance, adjustments, and paying a payslip books the expense |
| Finance → Accounts | Cash and bank accounts with derived balances |
| Documents → Generate | Pick a template and employee, fill the rest, preview live, print/PDF or download as an image |
| Documents → Templates | Rich-text letter editor with click-to-copy placeholder chips |
| Documents → Issued | Every letter ever generated, stored exactly as issued |
| Projects | Cards with derived progress and unread badges; detail view has overview, a task board and realtime team chat |
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
| `attendance:update` | Someone punches in or out |

Project chat runs over the same connection in per-project rooms (`message:new`, `typing`). **Membership is re-checked on join and again on every send**, so a client can't emit into a room it was never allowed to enter — a join-time check alone would be bypassable. If the socket drops, the chat falls back to REST so messages still send.

The public website never opens a socket — form posts on the website trigger the notifications server-side.

## Attendance rules

The attendance module replaces the team's HRM spreadsheet, and the defaults match it: a **10:00 PM – 1:00 AM** shift, a **6:00 AM overnight cutoff**, **10 minutes** grace, **3 hours** required per day, and **Friday/Saturday optional**. All of it is editable under Attendance → Settings.

Four rules are worth knowing because they drive payroll:

- **Shift-date attribution.** A punch before the 6 AM cutoff belongs to the *previous* day's shift, so clocking out at 12:40 AM still lands on the right day. All of this is computed in `COMPANY_TZ`, never in server-local time.
- **Optional days.** Friday and Saturday work adds to total hours but is never late, never absent, and never affects the bonus.
- **Perfect-attendance bonus.** Paid only for a month with zero late, absent, leave, and short days across every scheduled day.
- **In-progress days don't count.** A month is only assessed up to the last fully-elapsed shift, so nobody shows as absent for a shift that hasn't started yet.

This maths is the highest-risk part of the system — a timezone slip would silently corrupt payroll — so it is covered by 41 dedicated unit tests including the 05:59 / 06:00 / 06:01 cutoff boundaries.

### Giving someone punch-panel access

An **employee record** and a **login account** are separate things, and the punch panel only works once they're linked. Two conditions must both hold:

1. The employee is linked to a login — **Attendance → Employees → "Link login"**. You can attach an account that already exists or create a fresh one on the spot.
2. That account's role includes **`attendance.punch`** — the seeded `employee` role has it. The link dialog warns you upfront if the role you picked can't punch.

If either is missing, the panel shows *"Your account isn't linked to an employee record."* The user needs to log out and back in after being linked, since their session carries the old link state.

Unlinking removes punch access but keeps the account itself, and attendance history is never deleted.

## Money

Two rules keep the finance module honest:

- **Balances are derived, never stored.** An account's balance is always its opening balance plus every transaction against it, so a balance can't drift away from its history.
- **Payroll is a snapshot.** Generating payroll copies that month's attendance figures onto the payslip, so a later correction to an old attendance record can't silently change pay that was already issued. Re-running generation refreshes drafts but leaves approved and paid rows alone.

Paying a payslip books a salary expense automatically, and recording a receivable payment books the matching income — the ledger and the accounts can't disagree.

## HR documents

Six letters are seeded ready to use: offer, appointment, promotion, resignation acceptance, experience certificate and NOC. Templates are written in the rich-text editor using `{{placeholder}}` markers.

- **Most fields fill themselves.** Anything derivable from the employee record (name, ID, role, join date, salary) or your site settings (company name, email, address) is merged automatically. The generator only asks for what's genuinely specific to that letter.
- **Missing values are loud, not silent.** An unfilled placeholder renders as a highlighted `[field_name]` marker, so a gap is obvious on the preview instead of shipping as blank space in a signed letter.
- **Values are HTML-escaped on merge**, so a stray character in a name can't break the letter's markup.
- **Issued letters are frozen.** The rendered HTML is stored on generation, so editing or even deleting a template never changes a letter that has already gone out. Each one gets a reference like `WS/OFFER/2026/0007`.

Export is either a print dialog (the route to a PDF) or a PNG via `html-to-image`. The preview always renders on a white page regardless of the admin's theme — a letter exported in dark mode would otherwise be unreadable.

## Scheduled jobs

`node-cron`, all scheduled in `COMPANY_TZ`:

| Schedule | Job |
|---|---|
| 06:10 daily | Finalize the previous shift — auto-close open sessions, mark absentees, notify admins |
| every 15 min | Email reminders for confirmed meetings starting within the hour (sent once per meeting) |

---

## Project status

**Working end to end:** monorepo tooling · authentication with refresh tokens · dynamic roles and permissions · audit logging with device details · the full website CMS · media uploads · the public content API · the website reading its content, colours and navigation from the database · the rebuilt portfolio with shareable URL filters, search and case-study detail pages · all three website forms (contact, hero quote, meeting booking) submitting for real · the leads pipeline · meeting management with visitor emails · realtime admin notifications · attendance and HRM (punch panel, daily sheet, monthly report, leave, employee directory, nightly finalization) · finance and payroll (accounts, transactions, receivables, salary ledger generated from attendance) · the HR document generator with six seeded letter templates · project management with tasks, derived progress and realtime team chat · a permission-aware dashboard.

172 backend tests pass across auth/RBAC, leads, meetings, attendance, finance, documents, projects and the dashboard.

**Still to do:**

Most website *section components* still read from `frontend/src/data/*.ts` rather than the API. The pages, layout, navigation, theme, services, FAQs, portfolio and all three forms are converted; the remaining presentational sections (values, why-choose, industries, team, testimonials, pricing tables, process steps) continue to work from the static files. Each one migrates the same way: accept an optional prop, default it to the static export, and fetch in the page — see `services-grid.tsx` for the pattern.

Two things worth setting up when you're ready to go live:

- **Cloudinary keys** in `backend/.env` — image uploads in the CMS need them; everything else works without.
- **SMTP keys** — until they're set, emails are logged to the console instead of sent, so lead notifications and meeting confirmations won't actually reach anyone.
