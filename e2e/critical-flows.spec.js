/**
 * Tests E2E criticos para Taller Zapata.
 * Usan Playwright con page.route() para mockear el backend.
 *
 * Escenarios:
 * 1. Login → panel authenticated
 * 2. Crear nuevo caso
 * 3. Abrir caso → gestion view con tabs
 * 4. Navegar tabs en gestion
 * 5. Guardar cambios
 */
import { test, expect } from '@playwright/test';
import { setupMockApi } from './fixtures.js';

// Selectores basados en DataField (estructura: label > span + input)
const emailInput = () => 'label:has-text("Email") input';
const passwordInput = () => 'label:has-text("Contraseña") input';

async function login(page) {
  await page.goto('/');
  await page.locator(emailInput()).fill('admin@tallereszapata.com');
  await page.locator(passwordInput()).fill('correct');
  await page.locator('button:has-text("Ingresar")').click();
  
  // La app necesita tiempo para: login API → set session → load cases/notifications
  await page.waitForTimeout(4000);
  
  // Verificar que estamos autenticados: buscar heading "Panel general"
  await expect(page.getByRole('heading', { name: /panel general/i }).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Taller Zapata E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Capturar errores de JS y consola para debug
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`[CONSOLE ERROR] ${msg.text()}`);
    });
    
    await setupMockApi(page);
  });

  test('1. Debe mostrar formulario de login al cargar la app', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(emailInput())).toBeVisible();
    await expect(page.locator(passwordInput())).toBeVisible();
    await expect(page.locator('button:has-text("Ingresar")')).toBeVisible();
  });

  test('2. Debe hacer login y mostrar el shell autenticado con panel', async ({ page }) => {
    await login(page);
  });

  test('3. Debe permitir crear un nuevo caso desde el panel', async ({ page }) => {
    await login(page);

    await page.locator('button:has-text("Nuevo caso")').first().click();
    await expect(page.locator('text=Cliente')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Vehículo')).toBeVisible();
  });

  test('4. Debe abrir un caso y mostrar gestion con tabs', async ({ page }) => {
    await login(page);

    // Click en "Abrir carpeta" del primer caso
    await page.locator('button:has-text("Abrir carpeta")').first().click();
    
    // Verificar que navego a gestion (el heading dice "Gestión de trámites")
    await expect(page.getByRole('heading', { name: /gestión de trámites/i }).first()).toBeVisible({ timeout: 10000 });

    // Verificar tabs de gestion presentes (usan clase .tab-button)
    await expect(page.locator('.tab-button:has-text("Ficha")').first()).toBeVisible();
    await expect(page.locator('.tab-button:has-text("Presupuesto")').first()).toBeVisible();
    await expect(page.locator('.tab-button:has-text("Pagos")').first()).toBeVisible();
  });

  test('5. Debe poder navegar entre tabs y mostrar boton de guardar', async ({ page }) => {
    await login(page);

    await page.locator('button:has-text("Abrir carpeta")').first().click();
    await expect(page.getByRole('heading', { name: /gestión de trámites/i }).first()).toBeVisible({ timeout: 10000 });

    // Navegar al tab Presupuesto
    await page.locator('.tab-button:has-text("Presupuesto")').first().click();
    // Verificar que el tab está activo (tiene clase is-selected o is-active)
    await expect(page.locator('.tab-button.is-selected:has-text("Presupuesto"), .tab-button.is-active:has-text("Presupuesto")').first()).toBeVisible({ timeout: 5000 });

    // Navegar al tab Pagos
    await page.locator('.tab-button:has-text("Pagos")').first().click();
    await expect(page.locator('text=Guardar cambios')).toBeVisible({ timeout: 5000 });
  });
});
