# Wizard de Onboarding de Pacientes - Plan

## Tasks

### Phase 1: Infrastructure
- [x] Task 1: Create wizard context (wizard-context.tsx) with step navigation, URL sync, patient data state
- [x] Task 2: Create wizard stepper (wizard-stepper.tsx) with desktop/mobile visual indicators
- [x] Task 3: Create wizard navigation (wizard-navigation.tsx) with Back/Skip/Continue buttons
- [x] Task 4: Create wizard completion screen (wizard-complete.tsx) with summary

### Phase 2: Modify Existing Forms (backwards-compatible)
- [x] Task 5: Add onSuccess, hideNavigation, formId props to PatientForm
- [x] Task 6: Add onSuccess, hideNavigation, formId props to AnthropometryForm
- [x] Task 7: Add onSuccess, hideNavigation, formId props to MeasurementForm
- [x] Task 8: Add onSuccess, hideNavigation, formId, preselectedPatient props to MealPlanForm

### Phase 3: Step Components
- [x] Task 9: Create PatientInfoStep wrapping PatientForm
- [x] Task 10: Create AnamnesisStep with quick text-based anamnesis form
- [x] Task 11: Create AnthropometryStep wrapping AnthropometryForm
- [x] Task 12: Create MeasurementsStep wrapping MeasurementForm
- [x] Task 13: Create MealPlanStep wrapping MealPlanForm with preselected patient

### Phase 4: Orchestrator & Page
- [x] Task 14: Create OnboardingWizard orchestrator with AnimatePresence transitions
- [x] Task 15: Update patients/new/page.tsx to render wizard

### Phase 5: Quality
- [x] Task 16: TypeScript passes (tsc --noEmit)
- [x] Task 17: ESLint passes on all new/modified files
- [x] Task 18: Next.js build succeeds

## Status: All tasks passing
