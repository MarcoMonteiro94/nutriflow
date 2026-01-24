# Public Booking E2E Tests

This directory contains end-to-end tests for the public booking feature.

## Test Files

- `public-booking.spec.ts` - Tests for solo practitioner booking flow

## Test Coverage

### Solo Practitioner Booking Flow
- ✅ Page loads without authentication
- ✅ Displays nutritionist information
- ✅ Shows calendar and date selection
- ✅ Displays duration selector
- ✅ Shows patient information form
- ✅ Validates required fields
- ✅ Shows time slots when date is selected
- ✅ Prevents booking past time slots
- ✅ Completes full booking flow
- ✅ Handles minimal information booking
- ✅ Validates email format
- ✅ Shows loading states
- ✅ Handles invalid nutriId (404)

### Conflict Prevention
- ✅ UI shows occupied slots as disabled
- ✅ Server-side validation prevents double-booking (via API)

### Edge Cases
- ✅ Handles long patient names
- ✅ Handles special characters in input
- ✅ Prevents XSS in notes field

## Running Tests

```bash
# Run all booking tests
npm run test:e2e tests/booking/

# Run specific test file
npm run test:e2e tests/booking/public-booking.spec.ts

# Run in headed mode (see browser)
npx playwright test tests/booking/public-booking.spec.ts --headed

# Run specific test
npx playwright test tests/booking/public-booking.spec.ts -g "should load booking page"
```

## Test Requirements

For tests to run successfully:
1. Development server must be accessible (auto-started by Playwright)
2. Database must have at least one nutritionist with availability configured
3. Test nutritionist credentials in `tests/fixtures/test-data.ts` must be valid

## Test Strategy

The tests are designed to gracefully handle missing data:
- If no availability is configured, tests skip gracefully
- If database is not accessible, tests skip rather than fail
- Tests use unique email addresses to avoid conflicts

## Verification Steps

The tests verify the following acceptance criteria:
1. ✅ Visit /book/[nutriId] as unauthenticated user
2. ✅ Select available date and time slot
3. ✅ Fill patient information form
4. ✅ Submit booking
5. ✅ Verify appointment created (success message shown)
6. ✅ Verify patient record created (email deduplication works)
7. ✅ Verify no double-booking (conflict prevention works via disabled slots)
