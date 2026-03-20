# NutriFlow E2E Test Plan

## Prerequisites

1. **Supabase running** with service role key in `.env.local`
2. **Seed data**: `npx tsx scripts/seed-test-data.ts` (run before each test suite)
3. **Dev server**: Playwright auto-starts via `npm run dev` (see `playwright.config.ts`)

## Test Users (seeded)

| User | Email | Role | Org Status |
|------|-------|------|------------|
| Nutri (owner) | test-nutri@example.com | nutri/admin | Owner of "Clínica NutriTest" |
| Admin | test-admin@example.com | admin | Member of NutriTest |
| Receptionist | test-receptionist@example.com | receptionist | Member of NutriTest |
| Patient | test-patient@example.com | patient | Member of NutriTest |
| No Org | test-noorg@example.com | nutri | **No org** → redirects to /organization/create |
| Invited | test-invited@example.com | nutri | **Pending invite** → redirects to /invite/[token] |

All passwords: `TestPassword123!`

## Test Invite Tokens (seeded)

| Token | Status | Email |
|-------|--------|-------|
| `test-pending-invite-token-e2e-12345` | Valid (7 days) | test-invited@example.com |
| `test-expired-invite-token-e2e-99999` | Expired (-1 day) | test-expired@example.com |

---

## P0 — Critical (blocks usage)

### Authentication (`tests/auth/`)

| Test | File | Description |
|------|------|-------------|
| Login valid | `login-flow.spec.ts` | Valid credentials → redirect to dashboard, sidebar visible |
| Login invalid | `login-flow.spec.ts` | Wrong email/password → error message displayed |
| Login non-existent | `login-flow.spec.ts` | Non-existent user → error message |
| Empty fields | `login-flow.spec.ts` | HTML5 validation prevents submission |
| Form accessibility | `login-flow.spec.ts` | type=email, type=password, required attributes |
| No public signup | `login-flow.spec.ts` | Regular login page hides signup toggle |
| Auth redirect | `login-flow.spec.ts` | Authenticated user on /auth/login → redirect to dashboard |
| Logout | `logout-flow.spec.ts` | Logout button → redirect to /auth/login |
| Post-logout protection | `logout-flow.spec.ts` | After logout, /dashboard → redirect to login |

### Route Protection (`tests/auth/`)

| Test | File | Description |
|------|------|-------------|
| Protected routes | `route-protection.spec.ts` | /dashboard, /patients, /plans, /schedule, /settings, /patients/new, /plans/new, /organization/* → redirect to /auth/login |
| Public invite | `route-protection.spec.ts` | /invite/[token] accessible without auth |
| Public login | `route-protection.spec.ts` | /auth/login accessible without auth |

### Organization Redirect (`tests/auth/`)

| Test | File | Description |
|------|------|-------------|
| No org → create | `org-redirect.spec.ts` | User without org → redirect to /organization/create |
| Create page loads | `org-redirect.spec.ts` | /organization/create renders without redirect loop |
| Settings accessible | `org-redirect.spec.ts` | /settings loads for users without org |
| With org → dashboard | `org-redirect.spec.ts` | User with org → dashboard loads normally |

### Invite Acceptance (`tests/organization/`)

| Test | File | Description |
|------|------|-------------|
| Full flow | `invite-acceptance.spec.ts` | Login → redirect to /invite → accept → membership created → dashboard |
| Invalid token | `invite-acceptance.spec.ts` | Non-existent token → "Convite Inválido" |
| Expired token | `invite-acceptance.spec.ts` | Expired invite → expiration/invalid message |
| Unauthenticated | `invite-acceptance.spec.ts` | Invite page shows login/signup options |
| Redirect param | `invite-acceptance.spec.ts` | Login link includes redirect back to invite |

---

## P1 — Important (core features)

### Organization CRUD (`tests/organization/`)

| Test | File | Description |
|------|------|-------------|
| Form fields | `create-org.spec.ts` | Name and slug inputs visible |
| Required validation | `create-org.spec.ts` | Empty submit → HTML5 validation |
| Auto-slug | `create-org.spec.ts` | Typing name auto-generates slug |
| Create org | `create-org.spec.ts` | Valid data → redirect to dashboard |
| Invite flow | `invite-flow.spec.ts` | (existing) Invite dialog, role options |
| Org navigation | `organization-crud.spec.ts` | (existing) Sidebar link, dashboard metrics |

### Navigation (`tests/navigation/`, `tests/ui/`)

| Test | File | Description |
|------|------|-------------|
| Sidebar routes | `sidebar.spec.ts` | All main routes accessible and load correctly |
| Dashboard stats | `sidebar.spec.ts` | Dashboard shows statistics cards |
| User info | `sidebar.spec.ts` | Sidebar footer shows user avatar/name |
| Branding | `sidebar.spec.ts` | NutriFlow logo visible |
| Logout button | `sidebar.spec.ts` | Logout button visible in sidebar |
| Org link | `sidebar.spec.ts` | Admin/owner sees organization link |
| Active highlight | `sidebar.spec.ts` | Active nav item is visually highlighted |
| Sidebar elements | `sidebar-navigation.spec.ts` | (existing) Navigation display and interaction |

### Patients (`tests/patients/`)

| Test | File | Description |
|------|------|-------------|
| CRUD | `patient-crud.spec.ts` | (existing) Create, read, update patients |
| Form validation | `patient-form.spec.ts` | (existing) Form field validation |
| Search | `patient-search.spec.ts` | (existing) Search functionality |
| Anthropometry | `anthropometry.spec.ts` | (existing) Measurement tracking |

### Meal Plans (`tests/plans/`)

| Test | File | Description |
|------|------|-------------|
| Plan CRUD | `meal-plan-crud.spec.ts` | (existing) Create, read plans |
| Meal CRUD | `meal-crud.spec.ts` | (existing) Add, edit, delete meals |

### Schedule (`tests/schedule/`)

| Test | File | Description |
|------|------|-------------|
| Appointment CRUD | `appointment-crud.spec.ts` | (existing) Create, manage appointments |
| Form validation | `appointment-form-validation.spec.ts` | (existing) Appointment form checks |
| Reschedule | `reschedule-actions.spec.ts` | (existing) Reschedule and action flows |

---

## P2 — Secondary (edge cases)

### Patient Portal (`tests/patient-portal/`)

| Test | File | Description |
|------|------|-------------|
| Dashboard | `patient-dashboard.spec.ts` | (existing) Patient home page |
| Plan viewing | `plan-viewing.spec.ts` | (existing) View plan with token |
| Token access | `token-access.spec.ts` | (existing) Token validation |

### UI States (`tests/ui/`)

| Test | File | Description |
|------|------|-------------|
| Empty states | `empty-states.spec.ts` | (existing) Empty state displays |
| Loading states | `loading-states.spec.ts` | (existing) Loading indicators |
| Responsive | `responsive.spec.ts` | (existing) Responsive design |

---

## Stateful Tests Warning

The following tests **modify database state** and require re-seeding before subsequent runs:

1. **`invite-acceptance.spec.ts`** — Accepts pending invite, creates membership
2. **`create-org.spec.ts`** ("create with valid data") — Creates an organization for noOrg user

Run `npx tsx scripts/seed-test-data.ts` to reset state before running these tests.

---

## Running Tests

```bash
# Seed test data (required before first run and after stateful tests)
npx tsx scripts/seed-test-data.ts

# Run all tests
npx playwright test

# Run specific test suites
npx playwright test tests/auth/
npx playwright test tests/organization/invite-acceptance.spec.ts
npx playwright test tests/organization/create-org.spec.ts
npx playwright test tests/navigation/

# Run with UI (for debugging)
npx playwright test --ui
```
