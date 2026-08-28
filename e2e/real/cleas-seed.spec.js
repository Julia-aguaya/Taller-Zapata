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
  test.describe.configure({ mode: 'serial' });

  async function openPayments(page, caseId) {
    await page.goto(`/cases/${caseId}`);
    await page.getByRole('tab', { name: 'Pagos' }).click();
  }

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

  test('registra una factura y nota de crédito parcial para daño total favorable', { tag: ['@e2e', '@cleas', '@critical'] }, async ({ page }) => {
    await login(page);
    await openPayments(page, 9501);

    const invoicePanel = page.getByTestId('cleas-invoice-panel');
    await invoicePanel.getByLabel('Número fiscal').fill('00950001');
    await invoicePanel.getByLabel('Razón social').fill('Aseguradora E2E S.A.');
    await invoicePanel.getByRole('button', { name: 'Registrar factura' }).click();
    await expect(page.getByText('Factura CLEAS registrada.')).toBeVisible();
    await expect(invoicePanel.getByText('0001-00950001')).toBeVisible();

    await invoicePanel.getByLabel('Factura a acreditar').selectOption({ label: /0001-00950001/ });
    await invoicePanel.getByLabel('Número fiscal nota de crédito').fill('00951001');
    await invoicePanel.getByLabel('Monto nota de crédito').fill('100000');
    await invoicePanel.getByRole('button', { name: 'Registrar nota de crédito' }).click();
    await expect(page.getByText('Nota de crédito registrada.')).toBeVisible();
    await expect(invoicePanel.getByText('Total acreditado:')).toContainText('100.000');
  });

  test('registra pago de compañía con comprobante y genera liquidación para franquicia favorable', { tag: ['@e2e', '@cleas', '@critical'] }, async ({ page }) => {
    await login(page);
    await openPayments(page, 9503);

    const paymentPanel = page.getByTestId('cleas-company-payment-panel');
    await expect(page.getByText('Pago de franquicia a cargo del cliente')).toHaveCount(0);
    await paymentPanel.getByLabel('Bruto que cancela').fill('800000');
    await paymentPanel.getByLabel('O subir comprobante CLEAS').setInputFiles({ name: 'pago-9503.txt', mimeType: 'text/plain', buffer: Buffer.from('comprobante E2E') });
    await paymentPanel.getByTestId('cleas-company-payment-submit').click();
    await expect(page.getByText('Pago CLEAS de la compañía registrado.')).toBeVisible();
    await expect(paymentPanel.getByText('La compañía no tiene saldo pendiente.')).toBeVisible();

    const pdfResponse = page.waitForResponse((response) => response.url().includes('/cases/9503/cleas/liquidation-pdf'));
    await paymentPanel.getByTestId('cleas-liquidation-pdf').click();
    const response = await pdfResponse;
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('registra y revierte la franquicia cliente para franquicia adversa', { tag: ['@e2e', '@cleas', '@critical'] }, async ({ page }) => {
    await login(page);
    await openPayments(page, 9504);

    await page.getByTestId('cleas-customer-franchise-payment').click();
    const dialog = page.getByRole('dialog', { name: 'Registrar pago' });
    await dialog.getByLabel('Monto').fill('150000');
    await dialog.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByText('Pago registrado.')).toBeVisible();

    await page.getByLabel('Subir comprobante pago cliente a compañía').setInputFiles({ name: 'pago-cliente-9504.txt', mimeType: 'text/plain', buffer: Buffer.from('comprobante cliente compañía') });
    await page.getByTestId('cleas-customer-company-payment').click();
    await expect(page.getByText('Pago del cliente a la compañía actualizado.')).toBeVisible();

    await page.locator('[title="Anular pago"]').click();
    await page.getByRole('button', { name: 'Anular pago' }).click();
    await expect(page.getByText('Pago anulado.')).toBeVisible();
  });

  test('cierra el daño total adverso y bloquea su continuación', { tag: ['@e2e', '@cleas', '@critical'] }, async ({ page }) => {
    await login(page);
    await page.goto('/cases/9502');
    await page.getByRole('tab', { name: 'Gestión del Trámite' }).click();
    await page.getByRole('button', { name: 'Cerrar caso' }).click();
    await page.getByRole('button', { name: 'Confirmar cierre' }).click();
    await expect(page.getByText('Caso cerrado').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Trámite:/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Reparación:/ })).toBeDisabled();
  });

  test('crea el flujo CLEAS completo desde definición hasta liquidación', { tag: ['@e2e', '@cleas', '@critical'] }, async ({ page }) => {
    await login(page);
    await page.goto('/cases/9505');
    await page.getByRole('tab', { name: 'Gestión del Trámite' }).click();

    const definition = page.getByText('Definición del CLEAS').locator('..').locator('..').locator('..');
    await definition.getByLabel('CLEAS sobre').selectOption('DANIO_TOTAL');
    await definition.getByLabel('Dictamen').selectOption('A_FAVOR');
    await definition.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Definición CLEAS guardada.')).toBeVisible();

    const procedure = page.getByText('Tramitación').locator('..').locator('..').locator('..');
    await procedure.getByLabel('Fecha presentado').fill('2026-08-28');
    await procedure.getByLabel('Monto de cotización acordada').fill('100000');
    await procedure.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Tramitación CLEAS guardada.')).toBeVisible();

    await page.getByRole('tab', { name: 'Presupuesto' }).click();
    await page.getByPlaceholder('Ej: Guardabarros del. der.').fill('Paragolpes delantero');
    await page.locator('tbody input[type="number"]').first().fill('100000');
    await page.getByRole('button', { name: 'Generar presupuesto' }).click();
    await expect(page.getByText('Presupuesto generado y comparación creada.')).toBeVisible();

    await openPayments(page, 9505);
    const invoicePanel = page.getByTestId('cleas-invoice-panel');
    await invoicePanel.getByLabel('Número fiscal').fill('00950005');
    await invoicePanel.getByLabel('Razón social').fill('Aseguradora E2E S.A.');
    await invoicePanel.getByRole('button', { name: 'Registrar factura' }).click();
    await expect(page.getByText('Factura CLEAS registrada.')).toBeVisible();

    const paymentPanel = page.getByTestId('cleas-company-payment-panel');
    await paymentPanel.getByLabel('Bruto que cancela').fill('100000');
    await paymentPanel.getByLabel('O subir comprobante CLEAS').setInputFiles({ name: 'pago-9505.txt', mimeType: 'text/plain', buffer: Buffer.from('comprobante E2E flujo completo') });
    await paymentPanel.getByTestId('cleas-company-payment-submit').click();
    await expect(page.getByText('Pago CLEAS de la compañía registrado.')).toBeVisible();

    const pdfResponse = page.waitForResponse((response) => response.url().includes('/cases/9505/cleas/liquidation-pdf'));
    await paymentPanel.getByTestId('cleas-liquidation-pdf').click();
    expect((await pdfResponse).headers()['content-type']).toContain('application/pdf');
  });
});
