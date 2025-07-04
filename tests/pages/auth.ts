import type { Page } from '@playwright/test';
import { expect } from '../fixtures';

export class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading')).toContainText('Sign In');
  }

  async gotoSignup() {
    await this.page.goto('/signup');
    await expect(this.page.getByRole('heading')).toContainText('Sign Up');
  }

  async signup(email: string, password: string) {
    await this.gotoSignup();
    await this.page.getByPlaceholder('alan-turing@devs.club').click();
    await this.page.getByPlaceholder('alan-turing@devs.club').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign Up' }).click();
  }

  async login(email: string, password: string) {
    await this.gotoLogin();
    await this.page.getByPlaceholder('alan-turing@devs.club').click();
    await this.page.getByPlaceholder('alan-turing@devs.club').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async logout(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL('/');

    await this.openSidebar();

    const userNavButton = this.page.getByTestId('user-nav-button');
    await expect(userNavButton).toBeVisible();

    await userNavButton.click();
    const userNavMenu = this.page.getByTestId('user-nav-menu');
    await expect(userNavMenu).toBeVisible();

    const authMenuItem = this.page.getByTestId('user-nav-item-auth');
    await expect(authMenuItem).toContainText('Sign out');

    await authMenuItem.click();

    const userEmail = this.page.getByTestId('user-email');
    await expect(userEmail).toContainText('alan-turing@devs.club');
  }

  async expectToastToContain(text: string) {
    await expect(this.page.getByTestId('toast')).toContainText(text);
  }

  async openSidebar() {
    const sidebarToggleButton = this.page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();
  }
}
