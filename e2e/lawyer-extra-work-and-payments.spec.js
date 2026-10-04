import { expect, test } from '@playwright/test';
import { ExtraBudgetPage } from './pages/extra-budget-page';
import { LoginPage } from './pages/login-page';

test.describe('Reclamo de terceros por abogado: trabajos y pagos extras', () => {
  test('permite activar, aceptar y cobrar un trabajo extra', { tag: ['@e2e', '@high', '@lawyer', '@LAWYER-EXTRA-001'] }, async ({ page }) => {
    const login = new LoginPage(page);
    const extraBudget = new ExtraBudgetPage(page);

    await login.login('admin@demo.com', 'password');
    await expect(page).toHaveURL(/\/panel$/);
    await page.goto('/cases/9506');
    await extraBudget.openBudgetTab();
    await extraBudget.activateAndAcceptExtraWork();
    await expect(page.getByText('ACEPTADO')).toBeVisible();

    await extraBudget.openPaymentsTab();
    await expect(page.getByRole('heading', { name: 'Pagos adicionales del cliente' })).toBeVisible();
    await extraBudget.registerExtraPayment();
    await expect(page.getByText('Saldo pendiente').locator('..')).toContainText('$ 0');
  });
});
