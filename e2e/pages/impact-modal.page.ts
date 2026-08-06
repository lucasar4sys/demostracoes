import { Page, Locator, expect } from '@playwright/test';

export class ImpactModalPage {
  readonly page: Page;
  readonly closeButton: Locator;
  readonly title: Locator;
  readonly metricsSection: Locator;
  readonly sazonalidadeAlert: Locator;
  readonly ghostModeButton: Locator;
  readonly approvalJustificationInput: Locator;
  readonly approveButton: Locator;
  readonly simulate24hButton: Locator;
  readonly activatePrdButton: Locator;
  readonly exportJsonButton: Locator;
  readonly exportPdfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closeButton = page.locator('button.close-button');
    this.title = page.locator('.impact-panel header h1');
    this.metricsSection = page.locator('.metrics');
    this.sazonalidadeAlert = page.locator('.sazonalidade-alert');
    this.ghostModeButton = page.locator('button:has-text("Iniciar em Ghost Mode")');
    this.approvalJustificationInput = page.locator('.input-justification-group textarea');
    this.approveButton = page.locator('button.btn-approve');
    this.simulate24hButton = page.locator('button:has-text("Simular passagem das 24 horas")');
    this.activatePrdButton = page.locator('button.btn-activate-prd');
    this.exportJsonButton = page.locator('button:has-text("Exportar JSON Auditoria")');
    this.exportPdfButton = page.locator('button:has-text("Exportar PDF Trilha")');
  }

  async close() {
    await this.closeButton.click();
  }

  async startGhostMode() {
    await this.ghostModeButton.click();
  }

  async fillJustificationAndApprove(text: string) {
    await this.approvalJustificationInput.fill(text);
    await this.approveButton.click();
  }

  async simulate24hPass() {
    await this.simulate24hButton.click();
  }

  async activateProduction() {
    await this.activatePrdButton.click();
  }
}
