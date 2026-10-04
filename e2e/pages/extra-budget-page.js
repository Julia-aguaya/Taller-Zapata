export class ExtraBudgetPage {
  constructor(page) {
    this.page = page;
  }

  async openBudgetTab() {
    await this.page.getByRole('button', { name: 'Presupuesto' }).click();
  }

  async activateAndAcceptExtraWork() {
    await this.page.getByLabel('Activar trabajos extras').selectOption('SI');
    await this.page.getByLabel('Pieza afectada extra 1').fill('Paragolpes delantero');
    await this.page.getByLabel('Tarea extra 1').selectOption({ index: 1 });
    await this.page.getByLabel('Daño extra 1').selectOption({ index: 1 });
    await this.page.getByLabel('Repuestos extra 1').fill('15000');
    await this.page.getByRole('button', { name: 'Presentar al cliente' }).click();
    await this.page.getByLabel('¿El cliente acepta el presupuesto?').selectOption('SI');
  }

  async openPaymentsTab() {
    await this.page.getByRole('button', { name: 'Pagos' }).click();
  }

  async registerExtraPayment() {
    await this.page.getByRole('button', { name: 'Registrar pago del cliente' }).click();
    await this.page.getByLabel('Monto').fill('15000');
    await this.page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
  }
}
