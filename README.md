# GetTakaful - Peer-to-Peer Takaful Platform

A rebuilt version of the existing WordPress-based GetTakaful application using **Next.js** (frontend) + **Laravel** (backend). GetTakaful enables communities to create and manage peer-to-peer Takaful (Islamic insurance) groups with democratic claim voting.

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend    | Laravel 12, PHP 8.2+, MySQL                 |
| Auth       | Laravel Sanctum (token-based)               |
| Editor     | React Quill (rich text for group rules)     |

## Project Structure

```
GetTakaful/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Auth pages (login, signup, forgot-password, verify-email)
│   │   │   ├── (dashboard)/     # Protected pages (dashboard, groups, claims, settings)
│   │   │   ├── layout.tsx       # Root layout (AuthProvider, ToastProvider)
│   │   │   └── page.tsx         # Home redirect
│   │   ├── components/
│   │   │   ├── layout/          # DashboardLayout, Header, Sidebar, SlidePanel
│   │   │   ├── auth/            # AuthSkeleton
│   │   │   ├── groups/          # CreateGroupForm, InviteForm
│   │   │   └── ui/              # PasswordInput, RichTextEditor, ImageUploader, Toast, EmptyState
│   │   └── lib/
│   │       ├── api.ts           # Typed API client (authApi, groupsApi, claimsApi, dashboardApi)
│   │       └── auth-context.tsx # Auth state management (context + hooks)
│   └── public/img/              # Static assets (logo, icons)
├── backend/                     # Laravel API application
│   ├── app/
│   │   ├── Models/              # User, Group, Claim, Vote, Invitation
│   │   └── Http/Controllers/Api/
│   │       ├── AuthController.php       # Register, login, logout, OTP, forgot password
│   │       ├── GroupController.php      # CRUD, join, invite, token-based access
│   │       ├── ClaimController.php      # Submit claims, vote, file uploads
│   │       └── DashboardController.php  # Stats, pending votes, recent claims
│   ├── database/
│   │   ├── migrations/          # Users, groups, claims, votes, invitations
│   │   └── seeders/             # Test user seeder (test@example.com)
│   └── routes/api.php           # All API route definitions
├── docs/
│   └── api.md                   # Full API reference
└── README.md
```

## Setup

### Prerequisites

- PHP 8.2+
- Node.js 18+
- MySQL 8+
- Composer

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials (DB_DATABASE, DB_USERNAME, DB_PASSWORD)

php composer.phar install
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
# Backend runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

npm run dev
# Frontend runs on http://localhost:3000
```

### Static Assets

Copy logo files to `frontend/public/img/`:
- `logo.png` — Full logo for sidebar & auth pages
- `icon.png` — Collapsed sidebar icon

## Features

### Authentication
- Login / Signup with email & password
- Email verification via 6-digit OTP (10-minute expiry)
- Forgot password (generates and emails a temporary password)
- Token-based session management (Laravel Sanctum)

### Dashboard
- 4-card stats overview (my groups, joined groups, pending claims, total claim amount)
- Pending votes list (claims awaiting your vote)
- Recent claim status feed

### Takaful Groups
- **My Takaful** — Create and manage your own groups with configurable fees (management, claims processing, Shariah compliance, platform)
- **Joined Takaful** — View all groups you've joined
- **Group Detail** — Member list, financial stats (pool balance, contributions, claims paid), invite members, submit claims
- **Join via Token** — Public invite link with unique group token (UUID)

### Claims & Voting
- Submit claims with incident details, photos, police report, and digital signature
- Democratic voting system — group members approve or deny with optional comments
- Voting deadline enforcement
- Real-time vote tally (approved / denied counts)

### Account Settings
- Update profile info and profile picture
- Change password (requires current password)

### External Links
- Blog and Homepage redirect to gettakaful.ca in new tabs

## API Endpoints

### Public

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| POST   | `/api/auth/register`      | Register new user          |
| POST   | `/api/auth/login`         | Login                      |
| POST   | `/api/auth/send-otp`      | Send email verification OTP|
| POST   | `/api/auth/verify-otp`    | Verify OTP                 |
| POST   | `/api/auth/forgot-password` | Reset password via email |
| GET    | `/api/groups/token/{token}` | View group by invite token |

### Protected (requires Bearer token)

| Method | Endpoint                          | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/api/auth/logout`                | Logout                       |
| GET    | `/api/auth/user`                  | Get current user             |
| PUT    | `/api/auth/profile`               | Update profile               |
| PUT    | `/api/auth/password`              | Change password              |
| GET    | `/api/dashboard/stats`            | Dashboard statistics         |
| GET    | `/api/dashboard/pending-votes`    | Claims awaiting your vote    |
| GET    | `/api/dashboard/recent-claims`    | Your recent claims           |
| GET    | `/api/groups/my`                  | Your created groups          |
| GET    | `/api/groups/joined`              | Your joined groups           |
| POST   | `/api/groups`                     | Create a group               |
| GET    | `/api/groups/{group}`             | Group details                |
| POST   | `/api/groups/{group}/join`        | Join a group                 |
| POST   | `/api/groups/{group}/invite`      | Invite members by email      |
| GET    | `/api/groups/{group}/claims`      | List group claims            |
| POST   | `/api/claims`                     | Submit a new claim           |
| GET    | `/api/claims/{claim}`             | Claim details with votes     |
| POST   | `/api/claims/{claim}/vote`        | Vote on a claim              |

For detailed request/response examples, see [docs/api.md](docs/api.md).

## Data Models

```
User ──┬── creates ──→ Group ──── has many ──→ Claim ──── has many ──→ Vote
       │                 │                       │
       ├── joins ────────┘ (via group_members)   └── submitted by User
       │
       ├── submits ──→ Claim
       ├── votes on ─→ Claim (via Vote)
       └── invites ──→ Invitation
```

## Development

```bash
# Run backend
cd backend && php artisan serve

# Run frontend (separate terminal)
cd frontend && npm run dev

# Run tests
cd backend && php artisan test

# Lint frontend
cd frontend && npm run lint
```
