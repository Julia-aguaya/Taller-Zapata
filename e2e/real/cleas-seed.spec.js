import { expect, test } from '@playwright/test';

const CLEAS_CASES = [
  { id: 9501, folderCode: 'E2E-DT-AF', scope: 'Daño total', opinion: 'A favor' },
  { id: 9502, folderCode: 'E2E-DT-EC', scope: 'Daño total', opinion: 'En contra' },
  { id: 9503, folderCode: 'E2E-FR-AF', scope: 'Franquicia', opinion: 'A favor' },
  { id: 9504, folderCode: 'E2E-FR-EC', scope: 'Franquicia', opinion: 'En contra' },
];

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@demo.com');
  await page.getByLabel('Contraseña').fill('password');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/panel$/);
}

test.describe('CLEAS E2E seed', () => {
  for (const cleasCase of CLEAS_CASES) {
    test(`muestra ${cleasCase.folderCode} con su definición persistida`, { tag: ['@e2e', '@cleas'] }, async ({ page }) => {
      await login(page);
      await page.goto(`/cases/${cleasCase.id}`);

      await expect(page.getByRole('heading', { name: cleasCase.folderCode })).toBeVisible();
      await page.getByRole('tab', { name: 'Gestión del Trámite' }).click();
      await expect(page.getByText(`CLEAS sobre: ${cleasCase.scope}`)).toBeVisible();
      await expect(page.getByText(`Dictamen: ${cleasCase.opinion}`)).toBeVisible();
    });
  }
});
