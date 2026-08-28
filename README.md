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
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components (coming soon)
├── lib/                   # Utilities and helpers (coming soon)
├── public/                # Static assets (coming soon)
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

## Phase 1 Status

✅ Next.js and TypeScript configured  
✅ Tailwind CSS integrated  
✅ ESLint and Prettier configured  
✅ Basic landing page shell created  
✅ Environment variables set up

**Next Phase:** Database schema, authentication, and onboarding flows.

---

**Last Updated:** August 2026
