# NutriFlow Implementation Plan

## Overview

Este plano segue as melhores práticas para agentes de longa duração, com foco em:
- **Trabalho incremental**: Uma feature por sessão
- **Estado preservado**: Progresso em JSON (menos propenso a edições acidentais)
- **Verificação explícita**: Steps e2e antes de marcar `passes: true`

---

## Starting Ritual

```bash
# 1. Verificar diretório de trabalho
pwd  # Deve ser /home/marcomonteiro/Development/nutriflow

# 2. Verificar estado do ambiente
npm run build 2>&1 | head -20

# 3. Contar features pendentes
grep -c '"passes": false' plan.md

# 4. Verificar git log recente
git log --oneline -10

# 5. Identificar próxima feature com passes: false
```

---

## Feature Tracking

```json
{
  "project": "NutriFlow",
  "lastUpdated": "2026-01-20T20:15:00Z",
  "phases": [
    {
      "name": "Phase 1: Project Setup",
      "status": "complete",
      "features": [
        {
          "id": "1.1",
          "category": "infrastructure",
          "description": "Initialize Next.js 16.1 with TypeScript and Turbopack",
          "steps": [
            "Run create-next-app with TypeScript template",
            "Verify turbopack is enabled in dev script",
            "Run npm run dev and confirm server starts",
            "Run npm run build and confirm no errors"
          ],
          "passes": true
        },
        {
          "id": "1.2",
          "category": "infrastructure",
          "description": "Configure Tailwind CSS v4 and Shadcn/ui with Neutral theme",
          "steps": [
            "Install Tailwind CSS v4 dependencies",
            "Initialize Shadcn/ui with neutral theme",
            "Add a test component (Button)",
            "Verify component renders with correct styles"
          ],
          "passes": true
        },
        {
          "id": "1.3",
          "category": "infrastructure",
          "description": "Configure Supabase Client and Authentication Middleware",
          "steps": [
            "Install @supabase/supabase-js and @supabase/ssr",
            "Create client and server Supabase utilities",
            "Implement middleware for session refresh",
            "Verify middleware executes on route navigation"
          ],
          "passes": true
        },
        {
          "id": "1.4",
          "category": "ui",
          "description": "Implement base layout with Sidebar for Nutri and Bottom Nav for Patient",
          "steps": [
            "Create (nutri) route group with sidebar layout",
            "Create (patient) route group with bottom navigation",
            "Add navigation links to both layouts",
            "Verify routing works between sections"
          ],
          "passes": true
        }
      ]
    },
    {
      "name": "Phase 2: Core Infrastructure",
      "status": "complete",
      "features": [
        {
          "id": "2.1",
          "category": "database",
          "description": "Create database schema in Supabase with migrations",
          "steps": [
            "Initialize Supabase CLI and link project",
            "Create migration for profiles table",
            "Create migration for patients table",
            "Create migration for food_items table",
            "Create migration for meal_plans, meals, meal_contents tables",
            "Run supabase db push and verify tables exist",
            "Generate TypeScript types from schema"
          ],
          "passes": true
        },
        {
          "id": "2.2",
          "category": "security",
          "description": "Configure Row Level Security (RLS) for data isolation",
          "steps": [
            "Enable RLS on all tables",
            "Create policy: nutri can only see own patients",
            "Create policy: patient can only see own data",
            "Create policy: food_items visible to all, custom only to creator",
            "Test queries respect user isolation"
          ],
          "passes": true
        },
        {
          "id": "2.3",
          "category": "data",
          "description": "Import food database from TACO/IBGE via seed",
          "steps": [
            "Obtain TACO/IBGE food data CSV",
            "Create seed script to parse and insert data",
            "Run seed and verify food count matches source",
            "Test search query returns expected foods"
          ],
          "passes": true
        },
        {
          "id": "2.4",
          "category": "ui",
          "description": "Implement global search with Cmd+K shortcut",
          "steps": [
            "Install cmdk package",
            "Create CommandMenu component",
            "Register Cmd+K keyboard shortcut",
            "Implement search across patients and foods",
            "Verify modal opens and results display correctly"
          ],
          "passes": true
        }
      ]
    },
    {
      "name": "Phase 3: Nutritionist Workspace",
      "status": "complete",
      "features": [
        {
          "id": "3.1",
          "category": "functional",
          "description": "Dashboard with appointment summary and quick stats",
          "steps": [
            "Create dashboard page at /nutri",
            "Fetch today's appointments from database",
            "Display patient count and pending plans",
            "Add quick action cards for common tasks",
            "Verify data renders correctly from Supabase"
          ],
          "passes": true
        },
        {
          "id": "3.2",
          "category": "functional",
          "description": "Patient CRUD with profile view",
          "steps": [
            "Create patients list page with search",
            "Implement create patient form with validation",
            "Create patient detail page with tabs",
            "Implement edit and soft-delete functionality",
            "Verify all CRUD operations persist to database"
          ],
          "passes": true
        },
        {
          "id": "3.3",
          "category": "functional",
          "description": "Interactive calendar for appointment scheduling",
          "steps": [
            "Install calendar component (react-day-picker or similar)",
            "Create appointments table migration",
            "Implement month/week/day views",
            "Add create/edit appointment modal",
            "Verify appointments persist and display correctly"
          ],
          "passes": true
        },
        {
          "id": "3.4",
          "category": "functional",
          "description": "Anthropometry module with evolution charts",
          "steps": [
            "Create measurements table migration",
            "Implement measurement entry form",
            "Create weight/body fat evolution chart with Recharts",
            "Add before/after photo upload to Supabase Storage",
            "Verify charts render with real patient data"
          ],
          "passes": true
        }
      ]
    },
    {
      "name": "Phase 4: Smart Timeline",
      "status": "complete",
      "features": [
        {
          "id": "4.1",
          "category": "functional",
          "description": "Vertical timeline editor for meal plans",
          "steps": [
            "Create meal plan editor page",
            "Implement vertical timeline component",
            "Add meal slots with time picker",
            "Enable drag-and-drop reordering",
            "Verify timeline renders chronologically"
          ],
          "passes": true
        },
        {
          "id": "4.2",
          "category": "functional",
          "description": "Food search with dynamic macro calculation",
          "steps": [
            "Create food search combobox component",
            "Implement debounced search against database",
            "Add portion size input with unit selection",
            "Calculate and display macros in real-time",
            "Verify calculations match expected values"
          ],
          "passes": true
        },
        {
          "id": "4.3",
          "category": "functional",
          "description": "Food substitution system with expandable cards",
          "steps": [
            "Add substitution toggle to meal items",
            "Create expandable card showing alternatives",
            "Implement similar food suggestion algorithm",
            "Allow adding multiple substitution options",
            "Verify substitutions display in patient view"
          ],
          "passes": true
        },
        {
          "id": "4.4",
          "category": "functional",
          "description": "Auto-save meal plans with optimistic updates",
          "steps": [
            "Implement debounced save on changes",
            "Add saving indicator in UI",
            "Handle offline/error states gracefully",
            "Implement optimistic updates for responsiveness",
            "Verify changes persist after page refresh"
          ],
          "passes": true
        }
      ]
    },
    {
      "name": "Phase 5: Patient Portal & PWA",
      "status": "pending",
      "features": [
        {
          "id": "5.1",
          "category": "ui",
          "description": "Mobile-first meal plan view for patients",
          "steps": [
            "Create patient meal plan page",
            "Design mobile-optimized timeline view",
            "Add meal expansion for details and substitutions",
            "Implement swipe gestures for navigation",
            "Verify layout works on 320px-428px viewports"
          ],
          "passes": false
        },
        {
          "id": "5.2",
          "category": "security",
          "description": "Magic Link authentication for patients",
          "steps": [
            "Create token generation endpoint",
            "Implement magic link email/WhatsApp flow",
            "Create token verification middleware",
            "Handle token expiration gracefully",
            "Verify patient can access plan via link"
          ],
          "passes": false
        },
        {
          "id": "5.3",
          "category": "infrastructure",
          "description": "PWA manifest and Service Workers for offline support",
          "steps": [
            "Install and configure Serwist",
            "Create web manifest with icons",
            "Implement caching strategy for meal plans",
            "Add install prompt for mobile users",
            "Verify app installs and works offline"
          ],
          "passes": false
        },
        {
          "id": "5.4",
          "category": "functional",
          "description": "WhatsApp share button for meal plan links",
          "steps": [
            "Create share button in nutri dashboard",
            "Generate unique patient access link",
            "Implement WhatsApp deep link",
            "Add copy-to-clipboard fallback",
            "Verify link opens WhatsApp with pre-filled message"
          ],
          "passes": false
        }
      ]
    },
    {
      "name": "Phase 6: Polishing",
      "status": "pending",
      "features": [
        {
          "id": "6.1",
          "category": "ui",
          "description": "Smooth animations with Framer Motion",
          "steps": [
            "Install framer-motion",
            "Add page transition animations",
            "Implement list item stagger animations",
            "Add micro-interactions to buttons and cards",
            "Verify animations are smooth (60fps)"
          ],
          "passes": false
        },
        {
          "id": "6.2",
          "category": "ui",
          "description": "Empty states and loading skeletons",
          "steps": [
            "Create skeleton components for all lists",
            "Design empty state illustrations/messages",
            "Implement Suspense boundaries",
            "Add loading states to all data-fetching pages",
            "Verify no layout shift during loading"
          ],
          "passes": false
        },
        {
          "id": "6.3",
          "category": "testing",
          "description": "Integration tests for critical flows",
          "steps": [
            "Set up Playwright for e2e testing",
            "Write test: nutri creates meal plan",
            "Write test: patient accesses plan via magic link",
            "Write test: meal plan auto-saves correctly",
            "Verify all tests pass in CI environment"
          ],
          "passes": false
        }
      ]
    }
  ]
}
```

---

## Session Protocol

### Before Starting a Feature

1. Run `npm run build` - must pass
2. Run `npm run lint` - must pass
3. Read git log for recent context
4. Identify feature dependencies
5. Create branch: `git checkout -b feature/X.X-short-name`

### During Implementation

1. Implement incrementally with small commits
2. Run `npx tsc --noEmit` frequently
3. Test each step manually before proceeding
4. **NEVER** edit or remove existing tests
5. **NEVER** advance to next feature until current `passes: true`

### After Completing a Feature

1. Verify all steps in the feature pass
2. Run `npm run build && npm run lint`
3. Update this file: change `"passes": false` to `"passes": true`
4. Update `PRD.md`: change `[ ]` to `[x]`
5. Commit with descriptive message

---

## Session Notes

### 2025-01-20

**Completed:**
- Environment setup: `.env.local` configured
- Plan created with JSON feature tracking

**Next:**
- Feature 2.1: Database schema migrations

---

## Dependencies

```
2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 3.2 → 4.1 → 4.2 → 4.3 → 4.4
                         ↓
                        3.3
                         ↓
                        3.4

5.1 depends on 4.4
5.2 depends on 2.2
5.3 independent
5.4 depends on 5.2

6.x depends on all features
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Verify before commit |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript check |
| `npx supabase db push` | Push migrations |
| `npx supabase gen types typescript` | Generate types |
