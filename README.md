# MentorTrack

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-purple?style=flat)](https://better-auth.com/)

**MentorTrack** is a high-performance, multi-tenant student mentorship and cohort operations platform designed to streamline student progress tracking, assignment monitoring, outreach call workflows, and cohort analytics.

🌐 **Live Production:** [https://mentortrack.ismailjosim.com](https://mentortrack.ismailjosim.com)

---

## ⚡ Key Highlights & Architecture

- **Next.js 16 App Router & Server Components**: Core pages (`/dashboard`, `/students`, `/students/[id]`, `/reports`, `/bulk-update`) are structured as Server Components with streaming `<Suspense>` boundaries and metadata, paired with modular client components (`< 300` lines each).
- **High-Performance MongoDB Layer**: Tuned with compound indexes (`{ ownerId, createdAt }`, `{ ownerId, currentStatus, createdAt }`, `{ ownerId, lastContactedAt }`) and batched aggregation pipelines to eliminate N+1 query cascades and ensure sub-second response times.
- **Payload Optimization**: Overview payloads are trimmed and pre-aggregated on the server, cutting response sizes by over 95% for instant page loads.
- **Enterprise Multi-Tenancy**: Isolated workspaces where every student, call log, follow-up, and report is strictly scoped to the authenticated mentor.

---

## 🚀 Features

### 📊 Cohort Dashboard & Real-Time Analytics
- **Live Cohort Metrics**: Instant KPI tracking for Total, Active, On Track, Behind, At Risk, and Completed students.
- **Prioritized Outreach Queue**: Auto-generated call queue prioritized by student risk level and overdue follow-up dates.
- **Assignment Distribution**: Visual charts (via Recharts) displaying student submission and completion progression from `A-01` to `A-10`.
- **Students at Risk Table**: Paginated view of students needing immediate attention with direct deep-links to their student profiles.

### 🎓 Student Lifecycle & Progress Management
- **Search & Multi-Faceted Filters**: Instant filtering across status, progress range, mentorship group, working device, and academic program.
- **Individual Student Profiles**: Comprehensive dossier displaying contact details, educational background, hardware setup, full assignment history, call logs, and upcoming follow-ups.
- **Bulk Import**: Drag-and-drop CSV and Excel (`.xlsx`, `.xls`) import with schema validation, field auto-detection, interactive preview table, and duplicate handling.
- **Data Export**: Export filtered student rosters and outreach call lists to CSV/Excel for external analysis.

### 📝 Assignment Operations & Tracking
- **Standardized Assignments**: Structured tracking across 10 milestone assignments with statuses (`PENDING`, `SUBMITTED`, `COMPLETED`), submission marks, and completion dates.
- **Live Cohort Milestone**: Set and adjust the current active cohort assignment to automatically calculate student lag and risk statuses.
- **Bulk Assignment Matcher**: Paste or upload student email lists to batch-mark assignments as submitted or completed in a single action.

### 📞 Outreach Calls & Automated Follow-Ups
- **Call Logging**: Record detailed call logs with outreach outcomes, timestamps, and mentor notes.
- **Intelligent Follow-Up Automation**: Auto-schedules follow-up milestones (default: +7 days) upon logging calls.
- **Queue Resolution**: Automatically resolves open follow-ups when an outreach call is completed, maintaining a clean call queue.

### 📈 Cohort Reports & Deep-Dives
- **Cohort Summary**: High-level health snapshot of cohort momentum and mentorship participation.
- **Assignment Submission Breakdown**: Granular completion rates per assignment with percentage distributions.
- **Call Rounds Report**: Track mentor engagement frequency and overdue contact cycles.
- **Custom Section Generation**: Generate and export targeted report sections on demand.

### 🔒 Authentication & Workspace Security
- **Flexible Sign-In**: Email/password registration and Google OAuth 2.0 single sign-on.
- **Session Management**: Session persistence and token management powered by Better Auth with MongoDB adapter.
- **Protected Routes**: Middleware-enforced authorization with automated login redirects.

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling & Design** | Tailwind CSS v4, Lucide Icons, Tabler Icons, Radix UI Primitives, `tw-animate-css` |
| **State & Fetching** | React 19, Server Components, React Hot Toast, Client Invalidation Cache |
| **Database & ORM** | MongoDB 7, Mongoose 9.6.2 |
| **Authentication** | Better Auth 1.6.11 (MongoDB Adapter, Google OAuth) |
| **Charts & Visuals** | Recharts 3.8.1 |
| **File Processing** | ExcelJS, SheetJS (XLSX), CSV Parser |
| **Deployment** | Vercel |

---

## 📂 Project Structure

```text
src/
├── app/                          # Next.js App Router routes & API endpoints
│   ├── (auth)/                   # Authentication routes (login, register, error)
│   ├── api/                      # Authenticated REST API route handlers
│   │   ├── assignments/          # Assignment bulk submission & stats
│   │   ├── call-logs/            # Call log CRUD operations
│   │   ├── call-queue/           # Prioritized outreach queue endpoint
│   │   ├── dashboard/            # Overview, stats, and failing student APIs
│   │   ├── follow-ups/           # Follow-up scheduling & resolution
│   │   ├── reports/              # Aggregated cohort report generator
│   │   └── students/             # Student CRUD, import, analyze, & bulk-update
│   ├── bulk-update/              # Bulk operations dashboard
│   ├── dashboard/                # Main analytics & call queue dashboard
│   ├── reports/                  # Cohort reports & export interface
│   └── students/                 # Student roster, detail [id], new, & import
├── components/                   # Modular React components (< 300 lines each)
│   ├── auth/                     # Google OAuth button & credentials forms
│   ├── bulk-update/              # Assignment, mentorship, & student batch tabs
│   ├── Dashboard/                # KPI cards, charts, call queue, & risk tables
│   ├── Layout/                   # Navbar, sidebar, theme toggle, & app shell
│   ├── Reports/                  # Report options panel, cohort summaries, & charts
│   ├── Students/                 # Table filters, pagination, rows, modals, & profile
│   │   └── import/               # Dropzone, preview, & import wizard
│   └── ui/                       # Reusable design system primitives
├── lib/                          # Core utilities & domain logic
│   ├── api-client.ts             # Typed API client with cache tags
│   ├── auth.ts / auth-utils.ts   # Better Auth config & user authorization helpers
│   ├── follow-up-logic.ts        # Batched call-queue & follow-up business logic
│   ├── mongodb.ts                # Mongoose connection pooling & caching
│   ├── student-progress.ts       # Student risk & assignment calculation algorithms
│   └── utils.ts                  # Common helpers, class merge, & formatters
├── models/                       # Mongoose schemas & compound indexes
│   ├── CallLog.ts
│   ├── FollowUp.ts
│   ├── Settings.ts
│   └── Student.ts
└── types/                        # Shared TypeScript definitions & contracts
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** `20.9.0` or higher
- **pnpm** `9.x` or higher (recommended)
- **MongoDB** cluster (MongoDB Atlas or local MongoDB 6+)
- **Google Cloud Console Account** (optional, for Google SSO)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/mentor-track.git
cd mentor-track
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_DB_NAME=student-management

# Better Auth Configuration
BETTER_AUTH_SECRET=your-random-32-byte-base64-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Google OAuth 2.0 Credentials (Optional)
BETTER_AUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
BETTER_AUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Tip:** You can generate a secure `BETTER_AUTH_SECRET` by running:
> ```bash
> openssl rand -base64 32
> ```

### 3. Google OAuth Setup (Optional)

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project and configure the **OAuth consent screen**.
3. Create an **OAuth 2.0 Client ID** under **Credentials** (Application Type: *Web application*).
4. Add `http://localhost:3000` to **Authorized JavaScript origins**.
5. Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**.

### 4. Run the Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the app.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js local development server with Turbopack. |
| `pnpm build` | Compiles an optimized production build and checks TypeScript types. |
| `pnpm start` | Runs the compiled production server. |
| `pnpm lint` | Runs ESLint 9 across all codebase files. |
| `pnpm type-check` | Runs the TypeScript compiler without emitting files to verify types. |
| `pnpm format` | Formats files with Prettier. |
| `pnpm db:seed` | Seeds the database with sample students and assignments. |

---

## 🛡 License

This project is licensed under the [MIT License](LICENSE).
