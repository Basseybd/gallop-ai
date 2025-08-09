# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gallop AI (LLM Vibe Radar)** is a production-ready Next.js application that analyzes AI model biases and provides trend analysis capabilities. The application features two main functions:
1. Historical trend analysis comparing how different AI models rank topics over time
2. Statement vibe checking that analyzes sentiment and bias in text using multiple LLM providers

## Production Goals & Roadmap

**Core Refactoring Tasks:**
1. **Vercel AI SDK Integration**: Replace manual API key inputs with Vercel AI SDK via `lib/vercel-ai.ts` using server actions and streaming responses
2. **Component Architecture**: Refactor trend ranking logic into a reusable `TrendCard` component in `components/ui/`
3. **Statement Analysis Feature**: Scaffold `/statement` page with `StatementVibeChecker` component using shadcn/ui components (`Card`, `Progress`, `Badge`)
4. **Database Integration**: Set up persistent storage using Prisma + PlanetScale (or Supabase) with schema and server actions in `lib/db.ts`
5. **Utility Architecture**: Add shared hooks (`hooks/useModels.ts`) and types (`lib/types.ts`) for models and trends

## Development Commands

### Core Commands
```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Package Management
- This project uses **pnpm** as the package manager (note the `pnpm-lock.yaml`)
- Install dependencies: `pnpm install`
- Add packages: `pnpm add <package-name>`

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with React 19 (App Router)
- **AI Integration**: Vercel AI SDK with streaming responses and server actions
- **Database**: Prisma ORM with PlanetScale (MySQL) or Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **LLM Providers**: OpenAI, Anthropic, Gemini, Perplexity via unified interface
- **Deployment**: Vercel with edge functions and streaming support

### Key Directory Structure

**Core Application Files:**
- `/app/` - Next.js App Router pages and API routes
  - `/app/statement/` - Statement vibe checker page
- `/components/ui/` - Reusable shadcn/ui components including `TrendCard`
- `/components/` - Page-specific React components
- `/lib/` - Core utilities and business logic
  - `/lib/vercel-ai.ts` - Vercel AI SDK integration with streaming
  - `/lib/db.ts` - Database schema, Prisma client, and server actions
  - `/lib/types.ts` - Shared TypeScript types for models and trends
- `/hooks/` - Custom React hooks
  - `/hooks/useModels.ts` - Model management and selection utilities

**Key API Routes:**
- `/app/api/trends/route.ts` - Trend analysis with streaming responses
- `/app/api/statement/route.ts` - Statement vibe analysis endpoint
- `/app/api/models/route.ts` - Available LLM models management

### Core Components Architecture

**Main Application Pages:**
1. `app/page.tsx` - Historical trend analysis dashboard
2. `app/statement/page.tsx` - Statement vibe checker interface
3. `components/ui/TrendCard.tsx` - Reusable trend display component
4. `components/StatementVibeChecker.tsx` - Statement analysis interface

**Core Components:**
- `TrendCard` - Unified trend visualization with charts and rankings
- `StatementVibeChecker` - Uses `Card`, `Progress`, `Badge` from shadcn/ui
- Form components with real-time validation and streaming responses

**Data Architecture:**
1. `lib/vercel-ai.ts` - Centralized AI SDK integration with streaming
2. `lib/db.ts` - Prisma schema and server actions for persistence
3. `hooks/useModels.ts` - Model selection and management logic
4. `lib/types.ts` - Shared interfaces for trends, models, and analysis

### AI Integration Strategy

**Vercel AI SDK Architecture:**
- Server actions handle all LLM communications securely
- Streaming responses provide real-time feedback to users
- Unified interface across multiple LLM providers
- Built-in error handling and retry logic

**Multi-Model Support:**
- OpenAI GPT-4 with function calling
- Anthropic Claude with streaming responses
- Google Gemini with structured outputs
- Perplexity for real-time data analysis

**Database-Backed Analysis:**
- Historical queries stored in database for caching
- User preferences and model selections persisted
- Trend data computed and cached for performance
- Statement analysis results stored with timestamps

## Data Flow

**Trend Analysis Flow:**
1. **User Input**: Question selection through form with model preferences
2. **Server Action**: `lib/vercel-ai.ts` processes request with streaming
3. **Database Check**: Query `lib/db.ts` for cached results
4. **LLM Processing**: Parallel analysis across selected models
5. **Data Storage**: Persist results and trends to database
6. **Component Rendering**: `TrendCard` displays results with real-time updates

**Statement Analysis Flow:**
1. **Text Input**: User submits statement via `StatementVibeChecker`
2. **Streaming Analysis**: Real-time processing with progress indicators
3. **Multi-Model Analysis**: Sentiment, bias, and confidence scoring
4. **Result Display**: `Progress` bars, `Badge` components, and detailed insights

## Environment Variables

Required for production:
```bash
# LLM Provider Keys (managed via Vercel AI SDK)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here

# Database Configuration
DATABASE_URL="your_database_connection_string"
DIRECT_URL="your_direct_database_url" # For PlanetScale
# OR for Supabase:
# SUPABASE_URL="your_supabase_project_url"
# SUPABASE_ANON_KEY="your_supabase_anon_key"

# Next.js Configuration
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="your_deployment_url"
```

## Key Implementation Details

### Next.js App Router Patterns
- Use server actions for all database operations and LLM calls
- Implement streaming responses for real-time user feedback
- Leverage React Server Components for initial data loading
- Client components only for interactive UI elements

### TypeScript Architecture
- Define shared types in `lib/types.ts` for consistency
- Use strict TypeScript configuration with proper error handling
- Implement proper type guards for API responses
- Export interfaces for models, trends, and analysis results

### Tailwind & shadcn/ui Guidelines
- Follow shadcn/ui theming conventions for dark/light mode
- Use consistent spacing and typography scales
- Implement responsive design patterns
- Utilize CSS custom properties for dynamic theming

### Database & Caching Strategy
- Use Prisma migrations for schema versioning
- Implement server actions for all database operations
- Cache frequently accessed trend data with proper invalidation
- Store user preferences and analysis history

### Streaming & Real-time UX
- Implement progressive loading states for long-running analyses
- Use Vercel AI SDK streaming for incremental results
- Show real-time progress with `Progress` components
- Handle connection interruptions gracefully

## Development Notes

### Component Library
- Uses shadcn/ui components extensively
- Custom styling with Tailwind CSS classes
- Dark theme with custom color palette (`bg-[#6366F1]` for primary)

### TypeScript Configuration
- Build errors are ignored in production builds (`ignoreBuildErrors: true`)
- ESLint errors ignored during builds for faster deployment

### Testing & Development
- No test framework currently configured
- ESLint configured but ignored during builds

## Common Development Tasks

### Adding New LLM Provider
1. Add model configuration to `lib/types.ts`
2. Update `lib/vercel-ai.ts` with provider integration
3. Add model to `hooks/useModels.ts` selection logic
4. Update database schema if needed for model-specific data

### Creating New Analysis Features  
1. Define types in `lib/types.ts` for new analysis types
2. Create server action in `lib/db.ts` for data persistence
3. Build reusable component in `components/ui/`
4. Add streaming endpoint with proper error handling

### Database Schema Changes
1. Update Prisma schema in `prisma/schema.prisma`
2. Generate migration: `pnpm prisma migrate dev`
3. Update server actions in `lib/db.ts`
4. Add proper TypeScript types in `lib/types.ts`

### Component Development
- Place reusable components in `/components/ui/`
- Use shadcn/ui patterns for consistency
- Implement proper loading and error states
- Follow responsive design principles with Tailwind