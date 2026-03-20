import { test, expect } from '../fixtures/auth.fixture';
import { ChallengeFormPage } from '../fixtures/page-objects/challenges.page';
import { testChallenges } from '../fixtures/test-data';

test.describe('Challenge Creation Flow', () => {
  test('should show template selector on new challenge page', async ({ authenticatedPage }) => {
    const form = new ChallengeFormPage(authenticatedPage);
    await form.goto();
    await form.expectTemplateSelectorVisible();
  });

  test('should skip template and show empty form', async ({ authenticatedPage }) => {
    const form = new ChallengeFormPage(authenticatedPage);
    await form.goto();
    await form.skipTemplate();
    await form.expectFormVisible();

    // Title should be empty after skipping template
    await expect(form.titleInput).toHaveValue('');
  });

  test('should select template and prefill form', async ({ authenticatedPage }) => {
    const form = new ChallengeFormPage(authenticatedPage);
    await form.goto();
    await form.selectFirstTemplate();
    await form.expectFormVisible();

    // Title should be prefilled from template
    await expect(form.titleInput).not.toHaveValue('');
  });

  test('should create challenge with title and goal then redirect', async ({ authenticatedPage }) => {
    const form = new ChallengeFormPage(authenticatedPage);
    await form.goto();
    await form.skipTemplate();

    const uniqueTitle = `${testChallenges.challenge1.title} ${Date.now()}`;
    await form.fillTitle(uniqueTitle);
    await form.fillDescription(testChallenges.challenge1.description);
    await form.fillGoalTitle(testChallenges.challenge1.goalTitle);
    await form.submit();
    await form.expectRedirectToChallenge();
  });

  test('should show validation error when title is empty', async ({ authenticatedPage }) => {
    const form = new ChallengeFormPage(authenticatedPage);
    await form.goto();
    await form.skipTemplate();

    // Fill goal but not title
    await form.fillGoalTitle('Meta teste');
    await form.submit();

    // Expect toast error for missing title
    await form.expectToastError('O título é obrigatório');
  });
});
