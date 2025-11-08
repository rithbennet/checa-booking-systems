# ChECA Lab Service Booking Management System

A web application that digitizes the end-to-end lifecycle of lab service requests for Chemical Energy Conversions & Applications (ChECA) Lab.

## Tech Stack

- **Frontend**: Next.js 15 + React 19 (TypeScript)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (Email/Password + Google OAuth)
- **UI**: Tailwind CSS + Shadcn UI
- **Architecture**: Feature-Sliced Design (FSD)

## Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm 10+
- PostgreSQL (or Docker for local development)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd CHECA
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Fill in the required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret key for Better Auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Base URL of your application (e.g., `http://localhost:3000`)
- `BETTER_AUTH_GOOGLE_CLIENT_ID` - Google OAuth Client ID (optional)
- `BETTER_AUTH_GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (optional)

4. Set up the database
```bash
# Start local PostgreSQL (if using Docker)
./start-database.sh

# Run migrations
pnpm db:push

# Generate Prisma Client
pnpm postinstall
```

5. Seed the database with dummy accounts
```bash
pnpm db:seed
```

6. Start the development server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Database Seeding

The seed script creates 4 dummy accounts for development:

### Account Credentials

**Lab Administrator (Admin)**
- Email: `admin@checa.utm.my`
- Password: `Password123!`
- Role: Lab Administrator
- Status: Active

**Lab Administrator (Lab Admin)**
- Email: `labadmin@checa.utm.my`
- Password: `Password123!`
- Role: Lab Administrator
- Status: Active

**UTM Member**
- Email: `utm.member@utm.my`
- Password: `Password123!`
- Role: UTM Member
- Status: Active

**External Member**
- Email: `external@example.com`
- Password: `Password123!`
- Role: External Member
- Status: Active

To re-seed the database:
```bash
pnpm db:seed
```

## Project Structure

```
src/
├── app/              # Next.js app router (pages and layouts)
│   ├── (auth)/      # Authentication routes
│   └── (main)/      # Protected routes
├── shared/          # Shared code (utilities, UI components, server code)
│   ├── server/      # Server-side code (auth, database)
│   ├── ui/          # Reusable UI components (Shadcn)
│   └── styles/      # Global styles
├── entities/        # Business entities (User, Service, Booking, etc.)
├── features/        # Feature modules (auth, booking, etc.)
└── widgets/         # Complex UI widgets (layouts, dashboards)
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Run Biome linter
- `pnpm check:write` - Fix linting issues automatically
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed database with dummy data
- `pnpm db:studio` - Open Prisma Studio

## Architecture

This project follows **Feature-Sliced Design (FSD)** principles:

- **shared** - Shared utilities, UI components, and server code
- **entities** - Business entities (User, Service, Booking)
- **features** - Feature modules (authentication, booking management)
- **widgets** - Complex UI compositions (layouts, dashboards)
- **app** - Application layer (routing, page composition)

Import rules: `shared` → `entities` → `features` → `widgets` → `app`

## Authentication

The application uses Better Auth for authentication with:
- Email/Password authentication
- Google OAuth (optional)
- Session management with cookie caching
- Role-based access control (RBAC)

User roles:
- `lab_administrator` - Full admin access
- `utm_member` - UTM institutional member
- `mjiit_member` - MJIIT institutional member
- `external_member` - External organization member

## Database Schema

The database schema includes:
- Better Auth tables (user, session, account, verification)
- Application User model with role and status
- Service catalog with role-based pricing
- Booking requests and service items
- Service forms and invoices
- Payment tracking
- Sample tracking
- Analysis results
- Notifications
- Audit logs

See `prisma/schema.prisma` for the complete schema.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking: `pnpm check && pnpm typecheck`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## License

[Add your license here]
