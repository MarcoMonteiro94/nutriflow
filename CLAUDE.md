# NutriFlow - Project Guidelines

## Overview

NutriFlow is a nutrition management platform for nutritionists to manage patients, meal plans, appointments, and measurements.

## Roadmap

**IMPORTANTE:** No início de cada conversa, leia o arquivo `ROADMAP.md` para entender o estado atual do projeto e as prioridades.

- Sempre manter o `ROADMAP.md` atualizado após:
  - Concluir uma issue (marcar como ✅)
  - Iniciar trabalho em uma issue (marcar como 🔄)
  - Criar novas issues no GitHub
  - Mudar prioridades ou dependências

- Ao trabalhar em issues:
  1. Verificar dependências no roadmap antes de começar
  2. Atualizar status da issue no roadmap quando iniciar
  3. Atualizar status quando concluir (após merge)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion

## Design Guidelines

### Color Philosophy

**Use color with purpose, not decoration.**

- **Primary color**: Reserved for interactive elements (buttons, links, CTAs) and brand identity
- **Muted colors**: Default for icons, secondary text, borders
- **Semantic colors**: Only for communicating status or state:
  - `sky/blue`: Scheduled, pending, informational
  - `emerald/green`: Success, completed, active
  - `amber/yellow`: Warning, attention needed
  - `rose/red`: Error, cancelled, destructive

### What NOT to do

- ❌ Colorful avatars with random gradients per user
- ❌ Different colored icons in stats/metrics cards
- ❌ Rainbow badges or decorative gradients
- ❌ Using color to "make things pop" without functional meaning

### What TO do

- ✅ Consistent avatar style (primary/10 or muted background)
- ✅ Monochrome icons (muted-foreground)
- ✅ Color only for status indicators with clear meaning
- ✅ Subtle, professional aesthetic appropriate for healthcare

### Component Patterns

- Use `rounded-2xl` for cards and containers
- Use `rounded-full` for buttons and badges
- Use `shadow-soft` for elevation
- Prefer `bg-card` over `bg-background` for content sections
- Mobile-first responsive design

## Code Standards

### File Organization

- Page components in `app/(nutri)/[route]/page.tsx`
- Route-specific components in `app/(nutri)/[route]/_components/`
- Shared UI components in `components/ui/`
- Skeletons in `components/skeletons/`

### Naming Conventions

- Components: PascalCase (`PatientCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Database types in `types/database.ts`

### Data Fetching

- Server Components for initial data
- Client Components only when interactivity needed
- Use Supabase client from `@/lib/supabase/server` for server-side
- RLS policies handle authorization

## Git Workflow

- Conventional commits (be brief and descriptive)
- Do not include "Claude Code" in commit messages
- Test before committing

## Testing

- E2E tests in `e2e/` directory
- Run with `npm run test:e2e`
