import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to sign-in page when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/auth/signin**');
    expect(page.url()).toContain('/auth/signin');
  });

  test('should display sign-in form', async ({ page }) => {
    await page.goto('/auth/signin');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in the form
    await page.getByLabel(/email/i).fill('admin@miar.com');
    await page.getByLabel(/password/i).fill('Test1234');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');

    // Verify user name is displayed in header
    await expect(page.getByText(/MIAR Admin/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in incorrect credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/no user found|invalid password/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to sign-up page from sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.getByRole('link', { name: /sign up/i }).click();

    await page.waitForURL('**/auth/signup**');
    expect(page.url()).toContain('/auth/signup');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('should display sign-up form with all fields', async ({ page }) => {
    await page.goto('/auth/signup');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/^password/i).first().fill('weak');
    await page.getByLabel(/confirm password/i).fill('weak');

    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/^password/i).first().fill('Password123');
    await page.getByLabel(/confirm password/i).fill('DifferentPassword123');

    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should successfully sign out', async ({ page }) => {
    // First sign in
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('admin@miar.com');
    await page.getByLabel(/password/i).fill('Test1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Click user avatar to open menu
    await page.locator('button').filter({ hasText: /M/ }).first().click();

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should be redirected to sign-in page
    await page.waitForURL('**/auth/signin**');
    expect(page.url()).toContain('/auth/signin');
  });
});
