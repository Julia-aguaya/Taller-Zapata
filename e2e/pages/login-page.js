export class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Contraseña');
    this.submit = page.getByRole('button', { name: 'Ingresar' });
  }

  async login(email, password) {
    await this.page.goto('/login');
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
