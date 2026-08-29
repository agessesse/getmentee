# Mentee

A mentorship platform connecting students and young professionals with experienced mentors.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials in `.env.local`.

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Fix lint errors
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting
- `npm run type-check` — Run TypeScript type checking

## Project Structure

```
mentee/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Auth group (login, signup)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/                # Protected dashboard
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global Tailwind styles
├── components/
│   └── auth/                     # Authentication components
│       ├── login-form.tsx
│       └── signup-form.tsx
├── lib/
│   ├── auth-context.tsx          # Auth state management
│   └── supabase.ts               # Supabase client
├── supabase/
│   ├── migrations/               # SQL migrations
│   │   └── 0001_initial_schema.sql
│   └── seed.sql                  # Seed data (reference only)
├── public/                       # Static assets
├── .env.example                  # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## Technology Stack

- **Framework:** Next.js 15
- **Language:** TypeScript (strict mode)
- **UI:** React 19
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Production Build

```bash
npm run build
npm start
```

## Supabase Setup (Phase 2)

### Manual Configuration Required

Before running the app, you must:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your Project URL and Anon Key

2. **Apply Database Migrations**
   - In Supabase Dashboard → SQL Editor
   - Copy the contents of `supabase/migrations/0001_initial_schema.sql`
   - Paste and run it
   - This creates the `profiles` table, triggers, and RLS policies

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env.local
   ```
   - Add your Supabase Project URL as `NEXT_PUBLIC_SUPABASE_URL`
   - Add your Supabase Anon Key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Enable Email Authentication**
   - In Supabase Dashboard → Authentication → Providers
   - Ensure Email/Password is enabled (enabled by default)

### Database Architecture (Phase 2)

**profiles table:**

- `id` — UUID, references `auth.users(id)`
- `email` — User's email
- `first_name` — First name
- `last_name` — Last name
- `role` — `mentor` or `mentee`
- `avatar_url` — Profile photo (nullable)
- `created_at` — Account creation timestamp
- `updated_at` — Last update timestamp

**Row-Level Security:**

- Users can read their own profile
- Users can update their own profile
- Unauthenticated users cannot access profiles

**Auto Profile Creation:**

- A PostgreSQL trigger automatically creates a profile when a new user signs up
- Profile data is populated from signup form via `auth.users.raw_user_meta_data`

## Authentication Flow (Phase 2)

1. **Signup:** User fills form → Supabase Auth creates account → Trigger creates profile
2. **Login:** Email/password → Supabase Auth validates → Session established
3. **Dashboard:** Protected route → Redirects to login if unauthenticated
4. **Logout:** Clears Supabase session

## Phase Status

### Phase 1 ✅

✅ Next.js 15 and TypeScript configured  
✅ Tailwind CSS with custom theme  
✅ ESLint and Prettier configured  
✅ Basic landing page

### Phase 2 ✅ (In Progress)

✅ Supabase project structure  
✅ Database schema (profiles table)  
✅ Row-Level Security policies  
✅ Auth context and hooks  
✅ Login/signup pages  
✅ Protected dashboard  
✅ Session management  
⏳ **Awaiting:** Supabase credentials and manual migration setup on your machine

### Phase 3 (Planned)

- Complete profile setup (mentor/mentee details)
- Mentor discovery and matching
- Mentorship requests
- Messaging
- Scheduling
- Events

---

**Last Updated:** August 2026
