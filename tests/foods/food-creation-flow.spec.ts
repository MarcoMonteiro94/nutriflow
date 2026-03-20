import { test, expect } from '../fixtures/auth.fixture';
import { FoodFormPage, FoodsPage } from '../fixtures/page-objects/foods.page';
import { testFoods } from '../fixtures/test-data';

test.describe('Food Creation Flow', () => {
  test('should create food with name and macros then redirect to /foods', async ({ authenticatedPage }) => {
    const form = new FoodFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `${testFoods.food1.name} ${Date.now()}`;
    await form.fillForm({
      name: uniqueName,
      calories: testFoods.food1.calories,
      protein: testFoods.food1.protein,
      carbs: testFoods.food1.carbs,
      fat: testFoods.food1.fat,
    });
    await form.submit();
    await form.expectRedirectToFoods();
  });

  test('should show validation error when name is empty', async ({ authenticatedPage }) => {
    const form = new FoodFormPage(authenticatedPage);
    await form.goto();

    // Fill macros but not name
    await form.fillForm({
      calories: '100',
      protein: '10',
    });
    await form.submit();

    // Expect inline error message
    await form.expectError('O nome do alimento é obrigatório');
  });

  test('should create food with all fields', async ({ authenticatedPage }) => {
    const form = new FoodFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `${testFoods.foodFull.name} ${Date.now()}`;
    await form.fillForm({
      ...testFoods.foodFull,
      name: uniqueName,
    });
    await form.submit();
    await form.expectRedirectToFoods();
  });

  test('should show created food in the foods list', async ({ authenticatedPage }) => {
    const form = new FoodFormPage(authenticatedPage);
    await form.goto();

    const uniqueName = `Alimento Lista ${Date.now()}`;
    await form.fillForm({
      name: uniqueName,
      calories: '50',
    });
    await form.submit();
    await form.expectRedirectToFoods();

    // Verify food appears in the list
    const list = new FoodsPage(authenticatedPage);
    await list.expectFoodVisible(uniqueName);
  });
});
